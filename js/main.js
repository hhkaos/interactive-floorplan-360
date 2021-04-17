'use strict';

const initialLocation = 'corridor-1';
let mySvg;

// Init tour on floor 0
let tour = floor0;

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
        const location = tour[mySvg.querySelector('.active').id];
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
            console.error(`There is no location at the SVG with id: #${elem.locationID}`);
            return false;
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


