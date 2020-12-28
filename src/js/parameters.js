let Params = (function() {
    let waveform = document.getElementById('wave');
    let filter = document.getElementById('filter');
    let frequency = document.getElementById('frequency');
    let delay = document.getElementById('wet');
    let feedback = document.getElementById('feedback');
    let time = document.getElementById('time');
    let masterVolume = document.getElementById('masterVol');

    return {
        init: function() {
            waveform.addEventListener('change', function() {
                WebAudio.setWaveform(waveform.value);
            });

            filter.addEventListener('change', function() {
                WebAudio.setFilter(filter.value);
            });

            frequency.addEventListener('input', function() {
                WebAudio.setFilterFreq(frequency.value);
            });

            delay.addEventListener('input', function() {
                WebAudio.setDelay(delay.value);
            });

            feedback.addEventListener('input', function() {
                WebAudio.setFeedback(feedback.value);
            });

            time.addEventListener('input', function() {
                WebAudio.setDelayTime(time.value);
            });

            masterVolume.addEventListener('input', function() {
                WebAudio.setMasterGain(masterVolume.value);
            });
        }
    };
})();

Params.init();