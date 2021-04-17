'use strict';

window._IFP = window._IFP || {};
/*

*/
const renderApp = function(config){
    let floorMenu = '';
    Object.keys(config.floorplans).forEach((elem, i) => {
        if(i===config.defaultFloor){
            floorMenu += `<li class="active">${elem}</li>`
        }else{
            floorMenu += `<li>${elem}</li>`
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

const renderFloorPlan = function(dom, config){
    /*
    IF EMPTY -> FILL DOM
    */
    const appEl = document.querySelector(dom);
    const promises = Array();
    if(appEl.innerHTML.trim() === ""){

        appEl.appendChild(renderApp(config).querySelector("body > *"));

        Object.keys(config.floorplans).forEach((elem, i) => {

            promises.push(
                function(){
                    return fetch(config.floorplans[elem].tour)
                    .then(response => response.json()
                    )
                }
                );


                // .then(data => {
                //     debugger
                //     data.response)
                //     config.floorplans[data.floor].tourContent = data.response
                // });
            });
            let promisesWorking = promises.map(fn => fn());
            Promise.all(promisesWorking)
            .then(response =>{


                response.forEach(function(elem, i){

                    config.floorplans[i].tourContent = elem
                    // responses[0]().then(data => {console.log(data)})
                });


                // Init tour on floor 0
                const initTour = config.floorplans[config.defaultFloor]
                let tour = initTour.tourContent;
// debugger
                document.querySelector('#floorplan').data = initTour.floorplan;

                const panorama = pannellum.viewer('panorama', {
                    "default": {
                        "firstScene": initTour.initialLocation,
                    },
                    "scenes": tour,
                    "autoLoad": true,
                    // "hotSpotDebug": true,
                });

                // setTimeout(function () {
                //     const mouseoverEvent = new Event('mouseover');
                //     const firstEl = _IFP.mySvg.getElementById(config.initialLocation);
                //     firstEl.dispatchEvent(mouseoverEvent);
                //     firstEl.classList.add('active');
                // }, 300);

                panorama.on('scenechange', function (extWindow) {
                    const mySvg = _IFP.mySvg;
                    if (mySvg.querySelector('.active')) {
                        mySvg.querySelector('.active').classList.remove('active');
                        mySvg.querySelector('#' + extWindow).classList.add('active')
                    }
                });

                const getCurrentTranslate = function () {
                    const cx = _IFP.mySvg.querySelector('.active').getAttribute('cx');
                    const cy = _IFP.mySvg.querySelector('.active').getAttribute('cy');
                    return `translate(${cx} ${cy})`
                }

                // setInterval(() => {
                //     const mySvg = _IFP.mySvg;
                //     if (mySvg.querySelector('.active')) {
                //         const location = tour[mySvg.querySelector('.active').id];
                //         const currentYaw = panorama.getYaw();
                //         const initYaw = location.yaw;
                //         const newRotation = location.rotation - (initYaw - currentYaw);
                //         const newTransform = `${getCurrentTranslate()} rotate(${newRotation})`;
                //         mySvg.querySelector('#POV').setAttribute('transform', newTransform);
                //     }
                // }, 300);

                const createTriangle = function () {
                    let polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                    polygon.id = "POV";
                    //https://www.triangle-calculator.com/?what=sss&a=50&b=50&c=50&submit=Solve
                    // Triangle vertex coordinates: [0; 0] [50; 0] [25; 43.301]
                    polygon.setAttribute("points", "0 0 50 0 25 43.301");
                    polygon.setAttribute("style", "stroke:#660000; fill:#cc3333;");
                    return polygon;
                };

                // document.getElementById('floorplan').addEventListener('load', () => {
                //     let mySvg;
                //     _IFP.mySvg = mySvg = document.getElementById('floorplan').contentDocument;
                //     svgPanZoom(mySvg.querySelector('svg'),{
                //         zoomEnabled: true,
                //         fit: 1,
                //         center: 1
                //     })
                //     // debugger
                //     // mySvg.querySelector('#Plano').appendChild(createTriangle());
                //     mySvg.querySelector("svg > g").appendChild(createTriangle());

                //     Object.keys(tour).forEach((elem, i) => {
                //         const el = mySvg.getElementById(elem);
                //         if (!el) {
                //             console.error(`There is no location at the SVG with id: #${elem.locationID}`);
                //             console.error(elem)
                //             return false;
                //         }
                //         el.addEventListener('mouseover', evt => {
                //             if (!evt.target.classList.contains('active')) {
                //                 const activeEl = mySvg.querySelector('circle.active');
                //                 if (activeEl) {
                //                     mySvg.querySelector('circle.active').classList.remove('active');
                //                 }
                //                 panorama.loadScene(evt.target.id);
                //             }
                //         });
                //         el.addEventListener('mouseenter', evt => {
                //             el.classList.add('active');
                //         });
                //     });

                // });
            })
        }

        // const data = await Promise.all([promise1, promise2])




    };



