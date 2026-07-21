const assetFiles = import.meta.glob('/public/assets/**/*.png');
const allPaths = Object.keys(assetFiles).map(p => p.replace('/public', ''));

const getOptions = (dirs) => {
  const options = [{ id: 'none', name: 'None', path: null }];
  const targetDirs = Array.isArray(dirs) ? dirs : [dirs];
  
  targetDirs.forEach(dir => {
    const dirPaths = allPaths.filter(p => p.startsWith(`/assets/${dir}/`));
    // Sort alphanumerically
    dirPaths.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    
    dirPaths.forEach(path => {
      const filename = path.split('/').pop().replace('.png', '');
      options.push({
        id: filename,
        name: filename.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        path: path
      });
    });
  });
  return options;
};

export const CATEGORIES = {
  "skin": {
    "name": "Skin",
    "zIndex": 1,
    "options": [
      {
        "id": "skin_1",
        "color": "#fadcbc",
        "name": "Beige",
        "path": "/assets/base.png"
      },
      {
        "id": "skin_2",
        "color": "#ffdbac",
        "name": "Pale",
        "path": "/assets/base.png"
      },
      {
        "id": "skin_3",
        "color": "#f1c27d",
        "name": "Peach",
        "path": "/assets/base.png"
      },
      {
        "id": "skin_4",
        "color": "#e5c298",
        "name": "Olive",
        "path": "/assets/base.png"
      },
      {
        "id": "skin_5",
        "color": "#e0ac69",
        "name": "Golden",
        "path": "/assets/base.png"
      },
      {
        "id": "skin_6",
        "color": "#c68642",
        "name": "Tan",
        "path": "/assets/base.png"
      },
      {
        "id": "skin_7",
        "color": "#8d5524",
        "name": "Brown",
        "path": "/assets/base.png"
      },
      {
        "id": "skin_8",
        "color": "#3d2210",
        "name": "Dark",
        "path": "/assets/base.png"
      },
      {
        "id": "skin_9",
        "color": "#a2d149",
        "name": "Green",
        "path": "/assets/base.png"
      },
      {
        "id": "skin_10",
        "color": "#80b6f0",
        "name": "Blue",
        "path": "/assets/base.png"
      },
      {
        "id": "skin_11",
        "color": "#b88ce6",
        "name": "Purple",
        "path": "/assets/base.png"
      },
      {
        "id": "skin_12",
        "color": "#a4a8aa",
        "name": "Grey",
        "path": "/assets/base.png"
      },
      {
        "id": "skin_13",
        "color": "#ff4d4d",
        "name": "Red",
        "path": "/assets/base.png"
      },
      {
        "id": "skin_14",
        "color": "#fadc4a",
        "name": "Yellow",
        "path": "/assets/base.png"
      },
      {
        "id": "skin_15",
        "color": "#ff99cc",
        "name": "Pink",
        "path": "/assets/base.png"
      },
      {
        "id": "skin_16",
        "color": "#00ffff",
        "name": "Cyan",
        "path": "/assets/base.png"
      }
    ]
  },
  "eyes": {
    "name": "Eyes",
    "zIndex": 3,
    "options": getOptions("eyes")
  },
  "mouth": {
    "name": "Mouth",
    "zIndex": 4,
    "options": getOptions("mouth")
  },
  "hair_back": {
    "name": "Hair Back",
    "zIndex": 0,
    "options": getOptions("hair_back")
  },
  "clothes": {
    "name": "Clothes",
    "zIndex": 6,
    "options": getOptions("clothes")
  },
  "hair_bangs": {
    "name": "Hair Bangs",
    "zIndex": 7,
    "options": getOptions("hair_bangs")
  },
  "accessories_1": {
    "name": "Accessory 1",
    "zIndex": 8,
    "options": getOptions(["accessories", "facial_kineme"])
  },
  "accessories_2": {
    "name": "Accessory 2",
    "zIndex": 9,
    "options": getOptions(["accessories", "facial_kineme"])
  },
  "accessories_3": {
    "name": "Accessory 3",
    "zIndex": 10,
    "options": getOptions(["accessories", "facial_kineme"])
  }
};

export const CATEGORY_KEYS = ["skin","eyes","mouth","hair_back","hair_bangs","clothes","accessories_1","accessories_2","accessories_3"];
