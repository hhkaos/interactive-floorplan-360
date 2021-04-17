'use strict';

const initialLocation = 'corridor-1';
let mySvg;

const tour = {
    'corridor-1': {
        panorama: 'panoramas/corridor-1.jpg',
        yaw: 114,
        rotation: 52,
        "hotSpots": [
            {
                "pitch": 0,
                "yaw": 114.67,
                "type": "scene",
                "text": "Pasillo 2",
                "sceneId": "corridor-2",
                "cssClass": "pulsating-circle",
            }
        ]
    },
    'corridor-2': {
        panorama: 'panoramas/corridor-2.jpg',
        yaw: 20.28,
        rotation: -25,
        "hotSpots": [
            {
                "pitch": 0,
                "yaw": -75,
                "type": "scene",
                "text": "Pasillo 1",
                "sceneId": "corridor-1",
                "cssClass": "pulsating-circle",
            },
            {
                "pitch": 0,
                "yaw": -4,
                "type": "scene",
                "text": "Salón 1",
                "sceneId": "living-room-2",
                "cssClass": "pulsating-circle",
            },
            {
                "pitch": -20,
                "yaw": 22,
                "type": "scene",
                "text": "Pasillo 3",
                "sceneId": "corridor-3",
                "cssClass": "pulsating-circle",
            }
        ]
    },
    'corridor-3': {
        panorama: 'panoramas/corridor-3.jpg',
        yaw: -78,
        rotation: 12,
    },
    'living-room-1': {
        panorama: 'panoramas/living-room-1.jpg',
        yaw: -10,
        rotation: 35,
    },
    'living-room-2': {
        panorama: 'panoramas/living-room-2.jpg',
        yaw: -50,
        rotation: -155
    },
    'first-bathroom-0': {
        panorama: 'panoramas/first-bathroom-0.jpg',
        yaw: -157,
        rotation: 75
    },
    'first-bathroom-1': {
        panorama: 'panoramas/first-bathroom-1.jpg',
        yaw: -266,
        rotation: 122
    },
    'kitchen-1': {
        panorama: 'panoramas/kitchen-1.jpg',
        yaw: 281,
        rotation: 32
    },
    'kitchen-2': {
        panorama: 'panoramas/kitchen-2.jpg',
        yaw: 88,
        rotation: 55
    },
    'kitchen-3': {
        panorama: 'panoramas/kitchen-3.jpg',
        yaw: 96,
        rotation: 58
    }
};

const panorama = pannellum.viewer('panorama', {
    "default": {
        "firstScene": "corridor-1",
    },
    "scenes": tour,
    "autoLoad": true,
    // "hotSpotDebug": true,

});

panorama.on('scenechange', function (extWindow) {
    if (mySvg.querySelector('.active')) {
        mySvg.querySelector('.active').classList.remove('active');
        mySvg.querySelector('#' + extWindow).classList.add('active')
    }
});

const svg = function () {
    return document.getElementById('floorplan').contentDocument;
}

const getCurrentTranslate = function () {
    const cx = mySvg.querySelector('.active').getAttribute('cx');
    const cy = mySvg.querySelector('.active').getAttribute('cy');
    return `translate(${cx} ${cy})`
}

setInterval(function () {
    if (mySvg.querySelector('.active')) {
        const location = tour[mySvg.querySelector('.active').id]//locations.find(elem => elem.locationID === mySvg.querySelector('.active').id)
        const currentYaw = panorama.getYaw();
        const initYaw = location.yaw;
        const newRotation = location.rotation - (initYaw - currentYaw);
        const newTransform = `${getCurrentTranslate()} rotate(${newRotation})`;
        mySvg.querySelector('#POV').setAttribute('transform', newTransform);
    }
}, 300);

const createTriangle = function () {
    let polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.id = "POV";
    //https://www.triangle-calculator.com/?what=sss&a=50&b=50&c=50&submit=Solve
    // Triangle vertex coordinates: [0; 0] [50; 0] [25; 43.301]
    polygon.setAttribute("points", "0 0 50 0 25 43.301");
    polygon.setAttribute("style", "stroke:#660000; fill:#cc3333;");
    return polygon;
};

document.getElementById('floorplan').addEventListener('load', () => {

    mySvg = document.getElementById('floorplan').contentDocument;
    svgPanZoom(mySvg.querySelector('svg'),{
        zoomEnabled: true,
        fit: 1,
        center: 1
    })
    mySvg.querySelector('#Plano').appendChild(createTriangle());

    Object.keys(tour).forEach((elem, i) => {
        const el = mySvg.getElementById(elem);
        if (!el) {
            console.error(`There is no location at the SVG with id: #${elem.locationID}`)
            return false
        }
        el.addEventListener('mouseover', evt => {
            if (!evt.target.classList.contains('active')) {
                const activeEl = mySvg.querySelector('circle.active');
                if (activeEl) {
                    mySvg.querySelector('circle.active').classList.remove('active');
                }
                panorama.loadScene(evt.target.id);
            }
        });
        el.addEventListener('mouseenter', evt => {
            el.classList.add('active');
        });
    });

    setTimeout(function () {
        const mouseoverEvent = new Event('mouseover');
        const firstEl = mySvg.getElementById(initialLocation);
        firstEl.dispatchEvent(mouseoverEvent);
        firstEl.classList.add('active');
    }, 300);

});


