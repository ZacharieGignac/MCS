import xapi from 'xapi';
import { debug } from './debug';
import { config as systemconfig } from './config';
import { zapiv1 as zapi } from './zapi';






class HttpRequestQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    let self = this;
  }

  async httpRequest(url) {
    return new Promise(async (resolve, reject) => {
      this.queue.push({ url, resolve, reject });
      if (!this.isProcessing) {
        await this.processQueue();
      }
    });
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const { url, resolve, reject } = this.queue.shift();
    try {
      const response = await this._request(url);
      resolve(response);
    } catch (error) {
      reject(error);
    }

    await this.processQueue();
  }

  _request(clientParameters) {
    return new Promise((resolve, reject) => {
      var httpClientMethod;
      switch (clientParameters.Method.toUpperCase()) {
        case 'GET':
          httpClientMethod = xapi.Command.HttpClient.Get;
          break;
        case 'POST':
          httpClientMethod = xapi.Command.HttpClient.Post;
          break;
        case 'PUT':
          httpClientMethod = xapi.Command.HttpClient.Put;
          break;
        case 'DELETE':
          httpClientMethod = xapi.Command.HttpClient.Delete;
          break;
        case 'PATCH':
          httpClientMethod = xapi.Command.HttpClient.Patch
          break;
        default:
          reject(`Unknown HTTP method "${clientParameters.Method}"`);
      }
      delete clientParameters.Method;
      var body = clientParameters.Body || '';
      delete clientParameters.Body;
      httpClientMethod(clientParameters, body).then(response => {
        resolve(response);
      }).catch(err => {
        reject(err);
      });
      
    });
  }
}

export class HttpRequestDispatcher {
  constructor() {
    let self = this;
    debug(2, `HTTP Request Dispatcher Init... Creating ${systemconfig.system.httpDispatcherClients} clients.`);
    this.clients = [];
    for (let i = 0; i < systemconfig.system.httpDispatcherClients; i++) {
      let newHttpRequestQueue = new HttpRequestQueue();
      newHttpRequestQueue.id = i;
      this.clients.push(newHttpRequestQueue);
    }

    //Add ZAPI mapping
    var zapiCallStruct = {
      Get: (clientParameters) => {
        clientParameters.Method = 'GET';
        return self.httpRequest(clientParameters);
      },
      Post: (clientParameters) => {
        clientParameters.Method = 'POST';
        return self.httpRequest(clientParameters);
      },
      Put: (clientParameters) => {
        clientParameters.Method = 'PUT';
        return self.httpRequest(clientParameters);
      },
      Delete: (clientParameters) => {
        clientParameters.Method = 'DELETE';
        return self.httpRequest(clientParameters);
      },
      Patch: (clientParameters) => {
        clientParameters.Method = 'PATCH';
        return self.httpRequest(clientParameters);
      }
    }
    //TAG:ZAPI
    zapi.communication.httpClient = zapiCallStruct;
  }
  httpRequest(clientParameters) {
    let sortedClients = this.clients.sort((a, b) => {
      if (a.queue.length < b.queue.length) return -1;
      if (a.queue.length > b.queue.length) return 1;
      return 0;
    });
    let nextClient = sortedClients[0];
    debug(1, `HTTP Request Dispatcher: Dispatching request to client ${nextClient.id}. Queue length: ${nextClient.queue.length} (URL: ${clientParameters.Url})`);
    return nextClient.httpRequest(clientParameters);
  }
}

export class MessageQueue {
  constructor() {
    this.queue = [];
    this.sending = false;
    let self = this;
    //TAG:ZAPI
    zapi.communication.sendMessage = (message) => { self.send(message); };
  }

  send(text) {
    this.queue.push(text);
    if (!this.sending) {
      this.sendNextMessage();
    }
  }

  sendNextMessage() {
    if (this.queue.length === 0) {
      this.sending = false;
      return;
    }
    const message = this.queue.shift();
    xapi.Command.Message.Send({ Text: message });
    this.sending = true;
    setTimeout(() => {
      this.sendNextMessage();
    }, systemconfig.system.messagesPacing);
  }
}

