'use strict';

window._IFP = window._IFP || {};

const insertElement = (type, url, onload) => {
    let element;
    switch(type){
        case 'script':
            element = document.createElement('script');
            element.src = url;
            break;
        case 'link':
            element = document.createElement('link');
            element.setAttribute("rel", "stylesheet");
            element.setAttribute("href", url)
            break;
    }
    if(onload){
        element.onload = onload;
    }
    document.getElementsByTagName('head')[0].appendChild(element);
};

const renderApp = (config) => {
    let floorMenu = '';

    config.floorplansorder.forEach(elem => {
        if(elem === config.defaultFloor){
            floorMenu += `<li class="ipf-active" data-floor="${elem}">${elem}</li>`;
        }else{
            floorMenu += `<li data-floor="${elem}">${elem}</li>`
        }
    })

    if(typeof(pannellum) === "undefined"){
        // Inject dependencies
        insertElement('script', "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js", () => {
            setTimeout(() => {
                _IFP.setActiveFloor(config.defaultFloor)
            }, 300)
        });
        insertElement('link', "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css");
        insertElement('script', "js/svg-pan-zoom.min.js");
    }

    const xmlString = `
        <div class="ipf-container">
        <div class="ipf-column ipf-black-border">
        <ol class="ipf-floors">
        ${floorMenu}
        </ol>

        <object
        data="${config.floorplans[config.defaultFloor].floorplan}"
        id="ipf-floorplan"
        type="image/svg+xml"
        ></object>

        </div>
        <div class="ipf-column">
        <div id="ipf-panorama"></div>
        </div>
        </div>
    `;

    return new DOMParser().parseFromString(xmlString, "text/html").documentElement;
};

const setPanorama = (floorPlanId) => {
    document.querySelector("#ipf-panorama").innerHTML = ""
    _IFP.panorama = pannellum.viewer('ipf-panorama', {
        "default": {
            "firstScene": _IFP.config.floorplans[floorPlanId].initialLocation
        },
        "scenes": _IFP.config.floorplans[floorPlanId].tourContent,
        "autoLoad": true,
        "hotSpotDebug": _IFP.builder,
    });

    _IFP.panorama.on('scenechange', (extWindow) => {
        const mySvg = _IFP.mySvg;
        if (mySvg.querySelector('.ipf-active')) {
            mySvg.querySelector('.ipf-active').classList.remove('ipf-active');
            mySvg.querySelector('#' + extWindow).classList.add('ipf-active')
        }
    });

    _IFP.ready = _IFP.mySvg? true: false;
};

const setFloorPlan = (floorPlanId) => {
    document.querySelector('#ipf-floorplan').data = _IFP.config.floorplans[floorPlanId].floorplan;
};

_IFP.setActiveFloor = (id) => {
    _IFP.activeFloor = id;
    const activePlan = document.querySelector('.ipf-floors .ipf-active');
    if(activePlan){
        document.querySelector('.ipf-floors .ipf-active').classList.remove('ipf-active');
    }
    document.querySelector(`.ipf-floors [data-floor="${id}"]`).classList.add('ipf-active');
    setFloorPlan(id);
    setPanorama(id);
};

_IFP.getActivePlan = () => _IFP.config.floorplans[_IFP.activeFloor];

_IFP.getActiveScene = () => {
    let activeScene = null;
    if(_IFP.mySvg.querySelector('.ipf-active')){
        const sceneId = _IFP.mySvg.querySelector('.ipf-active').id;
        activeScene = _IFP.getActivePlan().tourContent[sceneId]
    }

    return activeScene;
}

const getCurrentTranslate = () => {
    let translate = '';
    if(_IFP.ready){
        const activeEl = _IFP.mySvg.querySelector('.ipf-active');
        const cx = activeEl? activeEl.getAttribute('cx'): 0;
        const cy = activeEl? activeEl.getAttribute('cy'): 0;
        translate = `translate(${cx} ${cy})`;

    }
    return translate;

};

const getInitialTranslate = () => {
    const cx = _IFP.mySvg.querySelector('#'+_IFP.getActivePlan().initialLocation).getAttribute('cx');
    const cy = _IFP.mySvg.querySelector('#'+_IFP.getActivePlan().initialLocation).getAttribute('cy');
    return `translate(${cx} ${cy})`
};

const createTriangle = () => {
    let polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.id = "POV";
    //https://www.triangle-calculator.com/?what=sss&a=50&b=50&c=50&submit=Solve
    // Triangle vertex coordinates: [0; 0] [50; 0] [25; 43.301]
    _IFP.mySvg.querySelector('#'+_IFP.getActivePlan().initialLocation)
    // const activePoint = _IFP.mySvg.querySelector('#'+_IFP.getActivePlan().initialLocation)
    // const x = parseFloat(activePoint.getAttribute('cx'))
    // const y = parseFloat(activePoint.getAttribute('cy'))
    polygon.setAttribute("points", `0 0 50 0 25 43.301`);
    if(_IFP.builder){
        polygon.setAttribute("style", "fill:#2196f3;");
    }else{
        polygon.setAttribute("style", "fill:#2196f300;");
    }
    polygon.setAttribute('transform', getInitialTranslate());
    return polygon;
};

const createSVGStyles = () => {
    let style = document.createElement('style');
    style.innerHTML = `
        circle:hover {
            cursor: pointer;
        }

        circle.ipf-active {
            fill: #2196f3;
        }
    `;
    return style;
}

const createCircle = (x,y,r) => {
    let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", r);
    circle.setAttribute("style", "fill:#C4C4C4;");
    return circle;
};

const interactiveFloorPlan = (dom, config) => {
    _IFP.config = config;
    const appEl = document.querySelector(dom);
    const promises = [];
    if(appEl.innerHTML.trim() === ""){
        /*
        IF EMPTY -> FILL DOM
        */
        appEl.appendChild(renderApp(config).querySelector("body > *"));

        document.querySelectorAll('.ipf-floors li').forEach(elem => {
            elem.addEventListener('click', (evt) => {
                _IFP.setActiveFloor(evt.target.innerText)
            });
        })

        // Generate array of fetch promises (one for each floor plan tour)
        // to wait for them afterwards
        config.floorplansorder.forEach((elem, i) => {
            promises.push(() => fetch(config.floorplans[elem].tour).then(response => response.json()));
        });

        const promisesWorking = promises.map(fn => fn());

        Promise.all(promisesWorking).then(response =>{
            response.forEach((elem, i) => {
                const floorPlanID = config.floorplansorder[i];
                config.floorplans[floorPlanID].tourContent = elem
            });

            _IFP.activeFloor = config.defaultFloor

            document.getElementById('ipf-floorplan').addEventListener('load', () => {
                let mySvg;

                _IFP.ready = _IFP.panorama? true: false;

                _IFP.mySvg = mySvg = document.getElementById('ipf-floorplan').contentDocument;
                svgPanZoom(mySvg.querySelector('svg'),{
                    zoomEnabled: true,
                    fit: 1,
                    center: 1
                })

                mySvg.querySelector("svg > g").appendChild(createTriangle());
                mySvg.querySelector("svg").appendChild(createSVGStyles())

                mySvg.addEventListener('click', evt => {
                    // let dim = evt.target.getBoundingClientRect();
                    // let x = evt.clientX - dim.left;
                    // let y = evt.clientY - dim.top;
                    let x = evt.clientX
                    let y = evt.clientY

                    // mySvg.querySelector("svg > g").appendChild(createCircle(x,y,12))
                    // debugger
                })

                // ipf-floorplan
                // el.addEventListener('click', evt => {

                const tour = _IFP.getActivePlan().tourContent;

                Object.keys(tour).forEach((elem, i) => {
                    const el = mySvg.getElementById(elem);
                    if (!el) {
                        console.error(`There is no location at the SVG with id: #${elem.locationID}`);
                        console.log(elem)
                        return false;
                    }
                    el.addEventListener('click', evt => {
                        if (!evt.target.classList.contains('ipf-active')) {
                            const activeEl = mySvg.querySelector('circle.ipf-active');
                            if (activeEl) {
                                activeEl.classList.remove('ipf-active');
                            }
                            _IFP.panorama.loadScene(evt.target.id);
                        }
                        el.classList.add('ipf-active');
                    });
                });

                setTimeout(() => {
                    const mouseoverEvent = new Event('click');
                    const firstEl = _IFP.mySvg.getElementById(_IFP.getActivePlan().initialLocation);
                    firstEl.dispatchEvent(mouseoverEvent);
                    firstEl.classList.add('ipf-active');
                }, 600);


                if(_IFP.interval){
                    clearInterval(_IFP.interval);
                }

                _IFP.interval = setInterval(() => {
                    const mySvg = _IFP.mySvg;

                    if (mySvg.querySelector('.ipf-active') && !_IFP.builder) {
                        const location = tour[mySvg.querySelector('.ipf-active').id];
                        const currentYaw = _IFP.panorama.getYaw();
                        const initYaw = location.yaw;
                        const newRotation = location.rotation - (initYaw - currentYaw);
                        const newTransform = `${getCurrentTranslate()} rotate(${newRotation})`;
                        const pov = mySvg.querySelector('#POV')
                        pov.setAttribute('transform', newTransform);
                        pov.setAttribute("style", "fill:#2196f3;");
                    }
                }, 300);

            });
        })
    }

};

document.addEventListener("keydown", e => {
    if (e.keyCode == 82 && e.code === "KeyR"){
        _IFP.panorama.startAutoRotate(8);
    }
});
