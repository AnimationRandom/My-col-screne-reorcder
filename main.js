let btn = document.querySelector('button')
btn.addEventListener('click', async function (){
    let stream = await navigator.mediaDevices.getDisplayMedia({
        video: true
    })
    
    const mime = MediaRecorder.isTypeSupported("video/webm; codecs=vp9")
             ? "video/webm; codecs=vp9"
             : "video/webm"
    let mediaRecorder = new MediaRecorder(stream, {
        mimeType: mime
    })

    let chunks = []
    mediaRecorder.addEventListener('dataavailable', function(e) {
        chunks.push(e.data)
    })
    
    mediaRecorder.addEventListener('stop', function() {
        let blob = new Blob(chunks, {
            type: chunks[0].type
        })
        
        let video = document.querySelector("video")
        video.src = URL.createObjectURL(blob)
        let a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'vibo.webm'
        a.click()
    })
    
    mediaRecorder.start()

    let video = document.createElement('video')
    video.autoplay = true
    video.volume = 0.01

    let canvas = document.getElementById("canvas")
    let output = document.getElementById("output")
    let start = document.getElementById("start")
    let stop = document.getElementById("stop")
    let download = document.getElementById("download")
    let enableMic = document.getElementById("enableMic")
    let micText = document.getElementById("micText")

    // mobile
    if ((/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent))) unsupported()

    let fps = 30
    let showWatermark = true
    let showCursor = true

    let encoding = 'video/webm'
    let config = { video: { cursor: showCursor ? "always" : "never" }, audio: true }

    let watermark = document.createElement('img')
    watermark.setAttribute("src", "./watermark.png")

    canvas.width = 854
    canvas.height = 480
    let ctx = canvas.getContext('2d')

    function awesomeScreenRecord() {
        navigator.mediaDevices.getDisplayMedia(config).then(async stream => {

            video.srcObject = stream

            begin.style.display = "none"
            download.style.display = "none"
            output.style.display = "none"
            cease.style.display = "inline-block"
            canvas.style.display = "block"
            enableMic.disabled = true

            let microphone = enableMic.checked ? await navigator.mediaDevices.getUserMedia({audio: true}).catch(e => null) : null
            let audTrack = new MediaStream(stream.getAudioTracks())

            let canvasStream = canvas.captureStream(30)
            canvasStream.width = 854
            canvasStream.height = 480
            canvasStream.fullcanvas = true
            let tracks = [audTrack, canvasStream]
            if (enableMic.checked && microphone) tracks.push(microphone)
            let mixer = new MultiStreamsMixer(tracks)
            mixer.startDrawingFrames();

            let recordedBlobs = [];
            let mediaRecorder = new MediaRecorder(mixer.getMixedStream(), {mimeType: encoding})
            let startTime = Date.now()
            mediaRecorder.start(100)
            mediaRecorder.ondataavailable = function(event) { if (event.data && event.data.size > 0) { recordedBlobs.push(event.data) } }
            mediaRecorder.onstop = function(event) {
                let duration = Date.now() - startTime
                let blob = new Blob(recordedBlobs, {type: encoding});
                ysFixWebmDuration(blob, duration, function(res) {
                    output.src = window.URL.createObjectURL(res);
                })
            }
            
            let capture = setInterval(() => {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                if (showWatermark) ctx.drawImage(watermark, 0, 0, canvas.width, canvas.height)
                video.volume = 0
            }, 1000 / fps);

            function stopRecording() {
                mixer.releaseStreams()
                mediaRecorder.stop()
                audTrack.stop()
                canvasStream.stop()
                if (microphone) microphone.stop()

                let tracks = video.srcObject.getTracks()
                tracks.forEach(track => track.stop())
                video.srcObject = null
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                clearInterval(capture)

                begin.style.display = "inline-block"
                download.style.display = "inline-block"
                output.style.display = "block"
                cease.style.display = "none"
                canvas.style.display = "none"

                enableMic.disabled = false
                video.volume = 0.1
            }

            stream.getVideoTracks()[0].addEventListener('ended', stopRecording )
            cease.addEventListener("click", stopRecording)

        }).catch(e => { 
            console.log("Error: " + e.message)
            console.log(e)
            switch(e.message) {
                case "Invalid state": unsupported(); break;
                case "Permission denied": break;
            }



        })
    }

    begin.addEventListener("click", awesomeScreenRecord)

    enableMic.addEventListener("change", x => {
        if (enableMic.checked) micText.classList.add("green")
        else micText.classList.remove("green")
    })

    download.addEventListener("click", x => {
        let tempA = document.createElement('a')
        document.body.appendChild(tempA);
        tempA.href = output.src
        tempA.download = "awesome screen recording"
        tempA.click();
        setTimeout(() => { document.body.removeChild(tempA) }, 500)
    })
