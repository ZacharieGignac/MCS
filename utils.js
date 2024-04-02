import xapi from 'xapi';
import { config as systemconfig } from './config';
import { zapiv1 as zapi } from './zapi';
import { debug } from './debug';

export class Storage {
  constructor() {
    this.STORAGEFILE = systemconfig.system.storageFile;
    this.storage;
  }


  async init() {
    zapi.system.events.emit('system_storage_init');
    debug(2, `Storage initializing...`);
    this.storage = await this.readStorage();
    debug(2, `Storage: Init done`);
    zapi.system.events.emit('system_storage_init_done');
  }


  async readStorage() {
    debug(2, `Storage: Reading storage file...`);
    let storageMacro = await xapi.Command.Macros.Macro.Get({
      Content: true,
      Name: this.STORAGEFILE
    });
    debug(2, `Storage size: ${storageMacro.Macro[0].Content.length} bytes`);
    let storageContent = storageMacro.Macro[0].Content;
    storageContent = atob(storageContent.substring(2));
    try {
      return JSON.parse(storageContent);
    }
    catch (e) {
      console.error(`Error reading storage file. The file is malformed.`);
      zapi.system.events.emit('system_storage_error_corrupted');
      this.resetStorage();
    }
    debug(2, `Storage: Storage loaded into memory.`);
  }

  read(name) {
    for (let file of this.storage.files) {
      if (file.name == name) {
        let decodedFileContent = atob(file.content);
        return (decodedFileContent);
      }
    }
  }
  async write(name, data) {
    let workingFile;
    let content = btoa(JSON.stringify(data));
    let size = content.length;
    for (let file of this.storage.files) {
      if (file.name == name) {
        workingFile = file;
      }
    }
    if (workingFile == undefined) {
      workingFile = {
        name: name,
        content: content,
        size: size
      };
      this.storage.files.push(workingFile);
    }
    else {
      workingFile.content = content;
      workingFile.size = size;
    }
    let macroContent = btoa(JSON.stringify(this.storage));
    await xapi.Command.Macros.Macro.Save({
      Name: this.STORAGEFILE,
      Overwrite: true,
      Transpile: false
    }, '//' + macroContent);
    zapi.system.events.emit('system_storage_file_modified', name);
  }


  list() {
    let filelist = [];
    for (let file of this.storage.files) {
      debug(1, `FILE=${file.name}, SIZE=${file.size}`);
      filelist.push({ name: file.name, size: file.size });
    }
    return filelist;
  }

  async del(name) {
    for (let file of this.storage.files) {
      if (file.name == name) {
        let index = this.storage.files.indexOf(file);
        this.storage.files.splice(index, 1);
        zapi.system.events.emit('system_storage_file_deleted', name);
      }
    }
  }


  async resetStorage() {
    zapi.system.events.emit('system_storage_reset');
    debug(3, 'Reseting storage to default...');
    this.storage = {
      files: []
    };
    this.write('storage.version', '1');
    this.write('storage.encoding', 'json');
    this.write('storage.encapsulation', 'base64');
    this.write('system.bootcount', 0);
    this.init();

  }
}

export class Performance {
  constructor() {
    this.counters = [];
    this.elapsedStarts = [];
  }
  setElapsedStart(name) {
    this.elapsedStarts[name] = new Date();
  }
  setElapsedEnd(name) {
    this.counters[name] = new Date() - this.elapsedStarts[name];
    this.counters[name] = this.counters[name] + 'ms';
    delete this.elapsedStarts[name];
  }
  clearElapsed(name) {

  }
  setCounter(name, value) {
    this.counters[name] = value;
  }
  getCounter(name) {
    return this.counters[name];
  }
  inc(name, num = 1) {
    if (this.counters[name] != undefined) {
      this.counters[name] += num;
    }
    else {
      this.counters[name] = num;
    }
  }
  dec(name, num = 1) {
    if (this.counters[name] != undefined) {
      this.counters[name] -= num;
    }
    else {
      this.counters[name] = num;
    }
  }
  reset() {
    this.counters = [];
    this.elapsedStarts = [];
  }
}