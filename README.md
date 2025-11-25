# @multiversx/template-dapp

The **MultiversX dApp Template**, built using [React.js](https://reactjs.org/) and [Typescript](https://www.typescriptlang.org/).
It's a basic implementation of [@multiversx/sdk-dapp](https://www.npmjs.com/package/@multiversx/sdk-dapp), providing the basics for MultiversX authentication and TX signing.

See [Dapp template](https://template-dapp.multiversx.com/) for live demo.

## Requirements

- Node.js version 16.20.0+
- Npm version 8.19.4+

## Getting Started

The dapp is a client side only project and is built using the [Create React App](https://create-react-app.dev) scripts.

### Instalation and running

### Step 1. Install modules

From a terminal, navigate to the project folder and run:

```bash
yarn install
```

### Step 2. Running in development mode

In the project folder run:

```bash
yarn start:devnet
yarn start:testnet
yarn start:mainnet
```

This will start the React app in development mode, using the configs found in the `vite.config.ts` file.
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

If you are running the victor-api locally (default port `3001`), add
`VITE_VDASH_SOCKET_URL=http://localhost:3001` to `.env.local` so the dapp reads
the same leaderboard data as the backend you are testing against.

The page will reload if you make edits.\
You will also see any lint errors in the console.

> **Note:** 
While in development, to test the passkeys provider use the following command:
`open -a Google\ Chrome --args --ignore-certificate-errors --ignore-urlfetcher-cert-requests`
Make sure to close all instances of Chrome after the development session.

### Step 3. Build for testing and production use

A build of the app is necessary to deploy for testing purposes or for production use.
To build the project run:

```bash
yarn build:devnet
yarn build:testnet
yarn build:mainnet
```

### Test mode (bypass authentication)

For automated demos or local testing you can bypass the MultiversX login guard by
creating an `.env.local` file (or updating the existing one) with
`VITE_TEST_MODE=true`. When this flag is set the app treats the session as
authenticated (skipping `/unlock`) and loads a mock wallet profile so the Dino
game can run without talking to the backend sockets. Remove or set the flag to
`false` when you need the usual authentication behaviour back. Test mode is
automatically disabled on production builds unless you also set
`VITE_ALLOW_TEST_MODE_IN_PROD=true` explicitly.

## Roadmap

See the [open issues](https://github.com/multiversx/mx-template-dapp/issues) for a list of proposed features (and known issues).

## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

One can contribute by creating _pull requests_, or by opening _issues_ for discovered bugs or desired features.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
