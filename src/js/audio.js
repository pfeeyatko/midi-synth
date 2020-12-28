let WebAudio = (function() {

    let audioContext;
    let wave = 'sine';
    let filter = 'lowpass';
    let oscillators = {};
    let tuna = null;
    let feedback = 0.25;
    let time = 250;
    let wet = 0;
    let masterGain = null;
    let masterFilter = null;

    const waveforms = ['sine', 'square', 'sawtooth', 'triangle'];
    const filters = ['lowpass', 'highpass', 'bandpass'];

    function midiToFreq(note) {
        return 440 * Math.pow(2, (note - 69) / 12);
    }

    function scale(num, inMin, inMax, outMin, outMax) {
        return (num - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }

    return {
        play: function(midi, velocity) {            
            // init and set up osc
            let osc = audioContext.createOscillator();
            osc.type = wave;
            osc.frequency.value = midiToFreq(midi);

            // set volume with gain
            let gainNode = audioContext.createGain();
            gainNode.gain.value = (velocity) ? scale(velocity, 0, 127, 0, 1) : 1;

            // add some compression
            let compressorNode = audioContext.createDynamicsCompressor();
            compressorNode.threshold.value = -50;

            // add some delay
            let delayNode = new tuna.Delay({
                feedback: feedback,
                delayTime: time,
                wetLevel: wet,
                dryLevel: 1
            });

            // osc -> gain -> compressor -> delay -> masterFilter -> masterGain -> out
            osc.connect(gainNode);
            gainNode.connect(compressorNode);
            compressorNode.connect(delayNode);
            delayNode.connect(masterFilter);
            masterFilter.connect(masterGain);
            masterGain.connect(audioContext.destination);

            // play sound and keep track of oscillators in an object
            oscillators[midi] = osc;
            osc.start();
        },

        stop: function(key) {
            if (key) {
                if (oscillators[key]) {
                    oscillators[key].stop();
                    delete oscillators[key];
                    return;
                }
            }
            
            for (let key in oscillators) {
                oscillators[key].stop();
                delete oscillators[key];
            }
        },

        setWaveform: function(value) {
            wave = waveforms[value];
        },

        setDelay: function(value) {
            wet = scale(value, 0, 100, 0, 1);
        },

        setFeedback: function(value) {
            feedback = scale(value, 0, 100, 0, 1);
        },

        setDelayTime: function(value) {
            time = value;
        },

        setFilter: function(type) {
            filter = filters[type];
            masterFilter.type = filter;
        },

        setFilterFreq: function(f) {
            masterFilter.frequency.value = scale(f, 1, 100, 0, 700);
        },

        setMasterGain: function(value) {
            masterGain.gain.value = (value) ? scale(value, 0, 100, 0, 1) : 0.5;
        },

        init: function() {
            // init audio context
            let AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioContext();

            // create tuna object and pass audio context
            tuna = new Tuna(audioContext);

            // create some master nodes
            masterFilter = audioContext.createBiquadFilter();
            masterGain = audioContext.createGain();
            
            // init master volume to 50%
            this.setMasterGain();
        }
    };
    
})();

WebAudio.init();