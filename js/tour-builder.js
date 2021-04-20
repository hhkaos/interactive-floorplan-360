'use strict';
_IFP.builder = true

setInterval(() => {
    if(_IFP.ready){

        const yaw = parseInt(_IFP.panorama.getYaw());
        const pitch = parseInt(_IFP.panorama.getPitch());
        let rotation = document.getElementById('myRange').value;

        // rotation += parseFloat(_IFP.mySvg.getElementById('POV').getAttribute('transform').match(/.*rotate\((.*)\)/i)[1])

        const newTransform = `${getCurrentTranslate()} rotate(${rotation})`;
        _IFP.mySvg.querySelector('#POV').setAttribute('transform', newTransform);

        const activeScene = _IFP.getActiveScene();

        let updatedScene = {...activeScene};
        updatedScene.yaw = yaw
        updatedScene.pitch = pitch
        updatedScene.rotation = rotation
        const str = JSON.stringify(updatedScene, null, 2)
        document.querySelector('.values').innerHTML = str;
    }
}, 300);
setTimeout(() => {
    _IFP.panorama.on('scenechange', (extWindow) => {
        console.log("Cambio escena")
        const mySvg = _IFP.mySvg;
        if (mySvg.querySelector('.ipf-active')) {
            mySvg.querySelector('.ipf-active').classList.remove('ipf-active');
            mySvg.querySelector('#' + extWindow).classList.add('ipf-active')
        }

        const rotation = _IFP.getActivePlan().tourContent[extWindow].rotation;
        if(rotation < 0){
            document.getElementById('myRange').value = 360  - rotation;
        }else{
            document.getElementById('myRange').value = rotation;
        }

    });
}, 2000);

// _IFP.getActivePlan()
