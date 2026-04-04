// Testing load balancing by logging the port number for each request

export const portLogger = (req, res, next) => {
  const port = process.env.PORT || 3000;

  // Log which server handled the request
//   console.log(`Hello from port ${port}`);

  // Attach port to the request object (optional)
  req.serverPort = port;

  // Override res.json to automatically include the port in all responses
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (typeof body === "object" && body !== null) {
      body.port = port; // attach port
    }
    return originalJson(body);
  };

  next();
};