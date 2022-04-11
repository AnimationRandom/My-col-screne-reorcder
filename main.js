let btn = document.querySelector('button')
btn.addEventListener('click', function (){
    let stream = navigator.mediaDevices.getDisplayMedia({
        video: true
})
