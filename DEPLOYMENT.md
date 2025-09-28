# Deployment Instructions

This document provides instructions on how to deploy the frontend application and connect it to the backend server.

## Backend API Requirements

The frontend application communicates with the backend using a combination of WebSockets and standard HTTP requests. Your backend server must implement the following endpoints:

### WebSocket API

The application will connect to a WebSocket server and expects to be able to send and receive the following events:

*   **`getProfile`**:
    *   **Description**: Fetches a user's profile.
    *   **Payload from Frontend**: `{ accessToken: string }`
    *   **Success Response from Backend**: A `getProfile` event with the user's profile data.
    *   **Error Response from Backend**: A `getProfileError` event.

*   **`getLeaderboard`**:
    *   **Description**: Fetches the game leaderboard.
    *   **Success Response from Backend**: A `getLeaderboard` event with the leaderboard data.
    *   **Error Response from Backend**: A `getLeaderboardError` event.

### HTTP API (Fallback)

The application uses a fallback mechanism for the leaderboard if the WebSocket connection is not available.

*   **Leaderboard Endpoint**:
    *   **Method**: `GET`
    *   **URL**: The URL for this endpoint is specified via the `VITE_PUBLIC_LEADERBOARD_URL` environment variable.
    *   **Response**: A JSON object containing the leaderboard data.

## Deployment to Vercel

This project is configured for continuous deployment to Vercel using GitHub Actions.

### Steps to Deploy:

1.  **Push to GitHub**: Deployments are automatically triggered when code is pushed to a configured branch (e.g., `main` for production, `dev` for development).

2.  **Configure Environment Variables**: You must configure the following environment variables in your Vercel project settings to connect the frontend to your backend:
    *   `VITE_PUBLIC_LEADERBOARD_URL`: The full URL of your HTTP leaderboard endpoint.
    *   `VITE_WEB_SOCKET_URL`: The URL of your WebSocket server.

    To add environment variables in Vercel:
    1.  Go to your project on the Vercel dashboard.
    2.  Navigate to **Settings > Environment Variables**.
    3.  Add the variables and their corresponding values.

### Vercel Configuration

The `vercel.json` file in the root of the project contains rewrite rules to ensure that all routes are handled by the client-side router. This is a standard configuration for a Single Page Application (SPA) and should not need to be modified for a standard deployment.
