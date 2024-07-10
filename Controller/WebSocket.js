// Function to handle incoming messages
export const handleMessage = (socket, data) => {
    console.log('Message received:', data);
    // Add your business logic here to process the message
};

// Function to handle disconnection
export const handleDisconnect = (socket) => {
    console.log('A user disconnected');
    // Add cleanup or additional logic upon disconnection
};

