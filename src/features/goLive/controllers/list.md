The Nginx RTMP module provides a control interface that allows you to manage RTMP streams dynamically using HTTP requests. Below is a list of common HTTP control URLs for managing streams:

---

### **HTTP Control URLs**
Replace `http://localhost:8080/control` with the URL of your Nginx RTMP HTTP server.

#### **1. List Streams**
Get a list of all currently active streams.

```
GET http://localhost:8080/control
```

---

#### **2. List Streams in a Specific Application**
Get a list of streams in a specific application (e.g., `live`).

```
GET http://localhost:8080/control/list?app=live
```

---

#### **3. Drop a Publisher**
Disconnect a specific publisher (streamer) by stream name.

```
POST http://localhost:8080/control/drop/publisher?app=live&name=<streamKey>
```

---

#### **4. Drop a Subscriber**
Disconnect a specific subscriber (viewer) by stream name.

```
POST http://localhost:8080/control/drop/subscriber?app=live&name=<streamKey>
```

---

#### **5. Kill All Publishers**
Disconnect all publishers in a specific application.

```
POST http://localhost:8080/control/kill/publishers?app=live
```

---

#### **6. Kill All Subscribers**
Disconnect all subscribers in a specific application.

```
POST http://localhost:8080/control/kill/subscribers?app=live
```

---

#### **7. Drop All Streams**
Disconnect all publishers and subscribers in a specific application.

```
POST http://localhost:8080/control/kill/all?app=live
```

---

### **Example: Node.js API to List Streams**
You can fetch the list of streams and display them programmatically.

```typescript
import axios from 'axios';

const listStreams = async () => {
    try {
        const response = await axios.get('http://localhost:8080/control/list?app=live');
        console.log('Active Streams:', response.data);
    } catch (error) {
        console.error('Error listing streams:', error);
    }
};

listStreams();
```

---

### **Testing with cURL**
You can use `curl` commands to test the HTTP control interface.

- **List all streams**:
  ```bash
  curl -X GET "http://localhost:8080/control"
  ```

- **Drop a publisher**:
  ```bash
  curl -X POST "http://localhost:8080/control/drop/publisher?app=live&name=streamKey"
  ```

- **Kill all publishers**:
  ```bash
  curl -X POST "http://localhost:8080/control/kill/publishers?app=live"
  ```

---

### **Notes**
1. Ensure that the `control` directive is enabled in your Nginx RTMP configuration:
   ```nginx
   http {
       server {
           listen 8080;

           location /control {
               rtmp_control all;
           }
       }
   }
   ```

2. These control endpoints are powerful tools for managing RTMP streams dynamically. Use them carefully, especially in production environments.

