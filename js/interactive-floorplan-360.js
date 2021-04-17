'use strict';

window._IFP = window._IFP || {};

const renderApp = function(config){
    let floorMenu = '';
    Object.keys(config.floorplans).forEach((elem, i) => {
        if(i===config.defaultFloor){
            floorMenu += `<li class="active" data-floor="${elem}">${elem}</li>`
        }else{
            floorMenu += `<li data-floor="${elem}">${elem}</li>`
        }

    });

    var xmlString = `
    <div class="container">
    <div class="column black-border">
    <ol class="floors">
    ${floorMenu}
    </ol>

    <object
    data="${config.floorplans[config.defaultFloor].floorplan}"
    id="floorplan"
    type="image/svg+xml"
    ></object>

    </div>
    <div class="column">
    <div id="panorama"></div>
    </div>
    </div>
    `;

    return new DOMParser().parseFromString(xmlString, "text/html").documentElement;
};

const setPanorama = (floorPlanId) => {
    document.querySelector("#panorama").innerHTML = ""
    _IFP.panorama = pannellum.viewer('panorama', {
        "default": {
            "firstScene": _IFP.config.floorplans[floorPlanId].initialLocation
        },
        "scenes": _IFP.config.floorplans[floorPlanId].tourContent,
        "autoLoad": true,
        // "hotSpotDebug": true,
    });

    _IFP.panorama.on('scenechange', function (extWindow) {
        const mySvg = _IFP.mySvg;
        if (mySvg.querySelector('.active')) {
            mySvg.querySelector('.active').classList.remove('active');
            mySvg.querySelector('#' + extWindow).classList.add('active')
        }
    });
};

const setFloorPlan = (floorPlanId) => {
    document.querySelector('#floorplan').data = _IFP.config.floorplans[floorPlanId].floorplan;
};

_IFP.setActiveFloor = (id) => {
    _IFP.activeFloor = id;
    const activePlan = document.querySelector('.floors .active');
    if(activePlan){
        document.querySelector('.floors .active').classList.remove('active');
    }
    document.querySelector(`.floors [data-floor="${id}"]`).classList.add('active');
    setFloorPlan(id);
    setPanorama(id);
};

_IFP.getActivePlan = () => _IFP.config.floorplans[_IFP.activeFloor];

const getCurrentTranslate = function () {
    const cx = _IFP.mySvg.querySelector('.active').getAttribute('cx');
    const cy = _IFP.mySvg.querySelector('.active').getAttribute('cy');
    return `translate(${cx} ${cy})`
};

const getInitialTranslate = function () {
    const cx = _IFP.mySvg.querySelector('#'+_IFP.getActivePlan().initialLocation).getAttribute('cx');
    const cy = _IFP.mySvg.querySelector('#'+_IFP.getActivePlan().initialLocation).getAttribute('cy');
    return `translate(${cx} ${cy})`
};

const createTriangle = function () {
    let polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.id = "POV";
    //https://www.triangle-calculator.com/?what=sss&a=50&b=50&c=50&submit=Solve
    // Triangle vertex coordinates: [0; 0] [50; 0] [25; 43.301]
    _IFP.mySvg.querySelector('#'+_IFP.getActivePlan().initialLocation)
    const activePoint = _IFP.mySvg.querySelector('#'+_IFP.getActivePlan().initialLocation)
    const x = parseFloat(activePoint.getAttribute('cx'))
    const y = parseFloat(activePoint.getAttribute('cy'))
    polygon.setAttribute("points", `0 0 50 0 25 43.301`);
    polygon.setAttribute("style", "stroke:#660000; fill:#cc3333;");
    polygon.setAttribute('transform', getInitialTranslate());
    return polygon;
};

const renderFloorPlan = function(dom, config){
    _IFP.config = config;
    const appEl = document.querySelector(dom);
    const promises = Array();
    if(appEl.innerHTML.trim() === ""){
        /*
            IF EMPTY -> FILL DOM
        */
        appEl.appendChild(renderApp(config).querySelector("body > *"));

        document.querySelectorAll('.floors li').forEach(elem => {
            elem.addEventListener('click', (evt) => {
                _IFP.setActiveFloor(evt.target.innerText)
            });
        })

        Object.keys(config.floorplans).forEach((elem, i) => {
            promises.push(
                function(){
                    return fetch(config.floorplans[elem].tour)
                    .then(response => response.json()
                    )
                });
            });

            const promisesWorking = promises.map(fn => fn());

            Promise.all(promisesWorking)
            .then(response =>{

                response.forEach(function(elem, i){
                    config.floorplans[i].tourContent = elem
                });

                _IFP.activeFloor = config.defaultFloor

                _IFP.setActiveFloor(config.defaultFloor)

                document.getElementById('floorplan').addEventListener('load', () => {
                    let mySvg;

                    _IFP.mySvg = mySvg = document.getElementById('floorplan').contentDocument;
                    svgPanZoom(mySvg.querySelector('svg'),{
                        zoomEnabled: true,
                        fit: 1,
                        center: 1
                    })

                    mySvg.querySelector("svg > g").appendChild(createTriangle());

                    const tour = _IFP.getActivePlan().tourContent;

                    Object.keys(tour).forEach((elem, i) => {
                        const el = mySvg.getElementById(elem);
                        if (!el) {
                            console.error(`There is no location at the SVG with id: #${elem.locationID}`);
                            console.error(elem)
                            return false;
                        }
                        el.addEventListener('mouseover', evt => {
                            if (!evt.target.classList.contains('active')) {
                                const activeEl = mySvg.querySelector('circle.active');
                                if (activeEl) {
                                    mySvg.querySelector('circle.active').classList.remove('active');
                                }
                                _IFP.panorama.loadScene(evt.target.id);
                            }
                        });
                        el.addEventListener('mouseenter', evt => {
                            el.classList.add('active');
                        });
                    });

                    setTimeout(function () {
                        const mouseoverEvent = new Event('mouseover');
                        const firstEl = _IFP.mySvg.getElementById(_IFP.getActivePlan().initialLocation);
                        firstEl.dispatchEvent(mouseoverEvent);
                        firstEl.classList.add('active');
                    }, 300);


                    if(_IFP.interval){
                        clearInterval(_IFP.interval);
                    }

                    _IFP.interval = setInterval(() => {
                        const mySvg = _IFP.mySvg;

                        if (mySvg.querySelector('.active')) {
                            const location = tour[mySvg.querySelector('.active').id];
                            const currentYaw = _IFP.panorama.getYaw();
                            const initYaw = location.yaw;
                            const newRotation = location.rotation - (initYaw - currentYaw);
                            const newTransform = `${getCurrentTranslate()} rotate(${newRotation})`;
                            mySvg.querySelector('#POV').setAttribute('transform', newTransform);
                        }
                    }, 300);

                });
            })
        }

    };



