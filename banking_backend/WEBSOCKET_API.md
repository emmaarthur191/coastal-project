# WebSocket API Documentation

This document describes the WebSocket endpoints available for real-time communication in the Banking Backend API.

## Authentication

All WebSocket connections require JWT authentication. Include the JWT access token as a query parameter:

```
?token=<your_jwt_access_token>
```

## Endpoints

### Banking Messages

**URL:** `ws://your-domain/ws/messages/{user_id}/`

**Purpose:** Real-time updates for banking messages (creation, read status updates)

**Events:**

#### Incoming Events (Client → Server)

- `mark_read`: Mark a message as read
  ```json
  {
    "type": "mark_read",
    "message_id": 123
  }
  ```

#### Outgoing Events (Server → Client)

- `message_update`: Message created or updated
  ```json
  {
    "type": "message_update",
    "message": {
      "id": 123,
      "user": 1,
      "subject": "Account Update",
      "body": "Your account balance has changed",
      "is_read": false,
      "read_at": null,
      "thread_id": "abc123",
      "parent_message": null,
      "replies": [],
      "created_at": "2023-12-01T10:00:00Z"
    }
  }
  ```

### Fraud Alerts

**URL:** `ws://your-domain/ws/fraud-alerts/{user_id}/`

**Purpose:** Real-time fraud alert notifications

**Events:**

#### Outgoing Events (Server → Client)

- `fraud_alert_update`: New fraud alert created
  ```json
  {
    "type": "fraud_alert_update",
    "alert": {
      "id": 456,
      "user": 1,
      "message": "Suspicious transaction detected",
      "severity": "high",
      "is_resolved": false,
      "resolved_at": null,
      "created_at": "2023-12-01T10:00:00Z"
    }
  }
  ```

### Notifications

**URL:** `ws://your-domain/ws/notifications/{user_id}/`

**Purpose:** General notification system for various events

**Events:**

#### Outgoing Events (Server → Client)

- `notification_update`: General notification
  ```json
  {
    "type": "notification_update",
    "notification": {
      "id": 789,
      "type": "system",
      "title": "System Maintenance",
      "message": "Scheduled maintenance tonight",
      "created_at": "2023-12-01T10:00:00Z"
    }
  }
  ```

## Message Threading

Banking messages support threading for conversations:

- `thread_id`: Groups related messages together
- `parent_message`: References the parent message in a thread
- `replies`: Array of reply messages (included in serialization)

## Error Handling

WebSocket connections may be closed for the following reasons:

- Invalid or expired JWT token
- User ID mismatch
- Server errors

Clients should implement reconnection logic with exponential backoff.

## Example Client Implementation

```javascript
// Connect to banking messages WebSocket
const ws = new WebSocket(`ws://your-domain/ws/messages/${userId}/?token=${token}`);

// Handle incoming messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'message_update') {
    console.log('New message:', data.message);
  }
};

// Mark message as read
ws.send(JSON.stringify({
  type: 'mark_read',
  message_id: 123
}));