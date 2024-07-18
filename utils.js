import xapi from 'xapi';
import { config as systemconfig } from './config';
import { zapiv1 as zapi } from './zapi';
import { debug } from './debug';

export class Storage {
  constructor() {
    this.version = 1;
    this.STORAGEFILE = systemconfig.system.storageFile;
    this.storage;

    //TAG:ZAPI
    zapi.storage.read = async (name) => { return await this.read(name); };
    zapi.storage.write = async (name, data) => { await this.write(name, data); };
    zapi.storage.list = async () => { return await this.list(); };
    zapi.storage.del = async (name) => { await this.del(name); };
    zapi.storage.resetStorage = async () => { this.resetStorage(); };
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
    try {
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
    catch (e) {
      this.resetStorage();
    }

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
    this.write('storage.version', this.version);
  }


  async resetStorage() {
    zapi.system.events.emit('system_storage_reset');
    debug(3, 'Reseting storage to default...');
    this.storage = {
      files: []
    };
    this.write('storage.version', this.version);
    this.write('storage.encoding', 'json');
    this.write('storage.encapsulation', 'base64');
    this.init();
  }
}

export class Performance {
  constructor() {
    try {
      this.counters = {};
      this.elapsedStarts = {};
      let self = this;
      //TAG:ZAPI
      zapi.performance.setElapsedStart = (name) => { self.setElapsedStart(name); };
      zapi.performance.setElapsedEnd = (name) => { self.setElapsedEnd(name); };
      zapi.performance.inc = (name, num) => { self.inc(name, num); };
      zapi.performance.dec = (name, num) => { self.dec(name, num); };
      zapi.performance.reset = () => { self.reset(); };
    } catch (error) {
      console.error("Error in Performance constructor:", error);
    }
  }

  setElapsedStart(name) {
    try {
      this.elapsedStarts[name] = new Date();
    } catch (error) {
      console.error(`Error in setElapsedStart for ${name}:`, error);
    }
  }

  setElapsedEnd(name) {
    try {
      this.counters[name] = new Date() - this.elapsedStarts[name];
      delete this.elapsedStarts[name];
    } catch (error) {
      console.error(`Error in setElapsedEnd for ${name}:`, error);
    }
  }

  clearElapsed(name) {
    try {
      delete this.elapsedStarts[name];
    } catch (error) {
      console.error(`Error in clearElapsed for ${name}:`, error);
    }
  }

  setCounter(name, value) {
    try {
      this.counters[name] = value;
    } catch (error) {
      console.error(`Error in setCounter for ${name}:`, error);
    }
  }

  getCounter(name) {
    try {
      return this.counters[name];
    } catch (error) {
      console.error(`Error in getCounter for ${name}:`, error);
      return undefined;
    }
  }

  inc(name, num = 1) {
    try {
      this.counters[name] = (this.counters[name] || 0) + num;
    } catch (error) {
      console.error(`Error in inc for ${name}:`, error);
    }
  }

  dec(name, num = 1) {
    try {
      this.counters[name] = (this.counters[name] || 0) - num;
    } catch (error) {
      console.error(`Error in dec for ${name}:`, error);
    }
  }

  reset() {
    try {
      this.counters = {};
      this.elapsedStarts = {};
    } catch (error) {
      console.error("Error in reset:", error);
    }
  }

  displayCounters() {
    try {
      console.log("Current counters:", this.counters);
    } catch (error) {
      console.error("Error in displayCounters:", error);
    }
  }
}