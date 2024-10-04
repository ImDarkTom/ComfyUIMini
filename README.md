# ComfyUI Mini

A mobile-friendly frontend to run ComfyUI workflows.

![](https://repository-images.githubusercontent.com/681240572/8c2ca9fa-921d-4490-959d-669c543ace4c) \*_Not affiliated with ComfyUI or comfyanonymous_

![](https://github.com/user-attachments/assets/f5356183-6f82-45ed-acab-82b015e22496)

## Features

-   Lightweight UI built for mobile devices
-   Save workflows locally on device or on your PC
-   Easy importing of workflows.
-   Generation progress info

## Requirements

#### For PC (Hosting WebUI):

-   **ComfyUI**: Ensure ComfyUI is installed and functional (reccomended Mar 13, 2023 release).
-   **NodeJS**: Version _15.6.0_ or higher.
-   **Package manager**: Perferrably NPM as Yarn has not been explicitly tested but should work nonetheless.

#### Mobile (Accessing WebUI):

-   **Browser**: Any modern browser with support for WebSocket.
-   **Network**: Connection to the same network as the hosting PC.

## Installation

1. Clone github repo (or download latest release)

```bash
git clone https://github.com/ImDarkTom/ComfyUIMini.git
cd ./ComfyUIMini
```

2. Install dependencies

With NPM:

```bash
npm install
```

Or with Yarn

```bash
yarn install
```

3. Run the app

```bash
node .
```

You may change the ComfyUI url/port in the config.json folder as well as the port the app runs on.

After sucessfully running you should see text along the lines of `Running on http://<local-ip>:<port>` in the console, simply put the local address of your PC along with the port into the url bar of another device and you should be able to see the main page.

## FAQ

### **Q**: I can't import my workflow.

-   **A**: You need to save your workflow in API Format to be able to import it as regular saving doesnt provide enough information to list all available inputs. For a guide on how to enable this option see video [here](https://imgur.com/a/YsZQu83).

### **Q**: Can you access the WebUI outside of the local network?

-   **A**: Yes you can through the use of port forwarding, however this carries security risks as it will allow anyone to potentially connect to your WebUI. As the process of setting up port forwarding varies greatly depending on your internet service provider I am unable to give specific instructions, however you may be able to find help by seaching '_[your ISP] enable port forwarding_'.

## Donating

If you find this WebUI to be useful and want to support development you can donate using the button below.

<a href="https://www.buymeacoffee.com/ImDarkTom" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-yellow.png" alt="Buy Me A Coffee" height="41" width="174"></a>
