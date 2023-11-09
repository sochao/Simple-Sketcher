# Simple Sketcher
A JavaScript-based tool for drawing molecular structures. Developed for NMR-Challenge project.

## Files:
- `index.html`: A demo page that showcases the molecule editor.
- `style.css`: The stylesheet for the editor's appearance.
- `molDraw.js`: The main JavaScript file containing the sketcher's functionality.


## How to integrate the editor into a webpage:
1. Link the stylesheet in the `<head>` section of your HTML:
```
<link rel="stylesheet" type="text/css" href="style.css">
```

2. Load the JavaScript file before the closing `</body>` tag:
```
<script type="text/javascript" src="molDraw.js"></script>
```

3. Insert a `div` element with the ID `molEdit` where you want the editor to appear:
```
<div id="molEdit"></div>
```

4. Initialize the editor after the page has loaded:
```
<script type="text/javascript">
    window.addEventListener('DOMContentLoaded', (event) => {
        molEdit.initUI();
    });
</script>
```

## Methods
- `molEdit.getSmiles()`: Returns an array of strings with SMILES representations for each isolated molecule.
- `molEdit.isEmpty()`: Returns `true` if no molecule is currently drawn on the sketcher.
- `molEdit.dump()`: Captures the current drawing scene and outputs it as a JSON string.
- `molEdit.load(json)`: Accepts a JSON string `json` and renders the molecule.
- `molEdit.getFormula()`: Returns an object representing the molecular formula.
- `molEdit.changeTheme('light'|'dark')`: Toggles the editor's theme between light and dark modes.
- `molEdit.initUI()`: Initializes the sketches.

## Event
An `input` event is fired whenever the molecule is edited. This event can be listened for and handled by adding an event listener to the molEdit element:
```
document.getElementById('molEdit').addEventListener('input', (event) => {
    // Callback function code here
});
```

## License
This project is licensed under the MIT license - see the `LICENSE.txt` file for details.
