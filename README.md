> [!NOTE]  
> This branch is currently an undergoing rewrite and the description here may not be fully accurate.

# ComfyUI Mini

A mobile-friendly WebUI to run ComfyUI workflows.

![App Preview](https://github.com/user-attachments/assets/78a52443-ac9c-498c-8df3-129acd94a48c)

## Features

-   ⚡ Lightweight UI built for mobile devices
-   💾 Workflows saved to device or PC
-   ⏳ Progress info when generating images
-   🤖 Automatic workflow importing
-   🖼️ Gallery of all generated images
-   🏷️ Booru-style autocomplete for prompt inputs

## Requirements

### For PC (Hosting WebUI):

-   **ComfyUI**: Ensure ComfyUI is installed and functional (minimum v0.2.2-50-7183fd1 / Sep. 18th release).
-   **NodeJS**: Version _20.0.0_ or higher.
-   **Package manager**: Perferrably NPM as Yarn has not been explicitly tested but should work nonetheless.

### Mobile (Accessing WebUI):

-   **Browser**: Any modern browser with support for WebSocket.
-   **Network**: Connection to the same network as the hosting PC.

## Installation

You can find a guide to installing and running the app on the **[getting started](https://github.com/ImDarkTom/ComfyUIMini/wiki/Getting-Started)** page.

## Tag Autocomplete Setup

ComfyUI Mini includes booru-style autocomplete for prompt inputs that helps you discover and use popular tags.

### Setting up Tags

1. **Download tag data**: Get the latest tag file from [Danbooru/e621 autocomplete tag lists](https://civitai.com/models/950325/danboorue621-autocomplete-tag-lists-incl-aliases-krita-ai-support) on Civitai.

2. **Extract and place**: Extract the downloaded file and copy one of the CSV files to your ComfyUI Mini directory as `server/data/tags.csv`.

>This feature was made with version '22.12.2024 Refined' and Booru/E621 tags.

### Tag File Format

The CSV file should follow this format:
```
Main Tag,Number of Aliases,Post Count,"Alias1,Alias2,Alias3"
```

Example:
```
1girl,0,6008644,"1girls,sole_female"
highres,5,5256195,"high_res,high_resolution,hires"
solo,0,5000954,"alone,female_solo,single,solo_female"
```

### How it Works

- Autocomplete appears when typing in prompt or negative prompt fields
- Start typing any tag or alias (minimum 2 characters)
- Click to select a tag
- Aliases will be replaced with the main tag when selected
- Tags are sorted by popularity (post count)

### Configuration:

- There are new settings in the webUI to configure how autocomplete functions.

## FAQ

### **Q**: I can't import my workflow.

-   **A**: You need to save your workflow in API Format to be able to import it as regular saving doesnt provide enough information to list all available inputs. For a guide on how to enable this option see video [here](https://imgur.com/a/YsZQu83).

### **Q**: Can you access the WebUI outside of the local network?

-   **A**: Yes you can through the use of port forwarding, however this carries security risks as it will allow anyone to potentially connect to your WebUI. As the process of setting up port forwarding varies greatly depending on your internet service provider I am unable to give specific instructions, however you may be able to find help by seaching '_[your ISP] enable port forwarding_'.

## Donating

If you find this WebUI to be useful and want to support development you can donate using the button below.

<a href="https://www.buymeacoffee.com/ImDarkTom" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-yellow.png" alt="Buy Me A Coffee" height="41" width="174"></a>
