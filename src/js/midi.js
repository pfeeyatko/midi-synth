let Midi = (function() {

    const NOTE_ON = 144;
    const NOTE_OFF = 128;

    let octave = 0;

    let keyDown = [];
    let keyMap = {a:53, w:54, s:55, e:56, d:57, r:58, f:59, g:60, y:61, h:62, u:63, j:64};

    let inputs = [];
    let chordMemory = [];
    let virtualKeys = true;
    let noteRepeat = false;
    let noteRepeatIntervalIds = [];

    let bpm = document.getElementById('bpm');
    let repeatVal = document.getElementById('repeat-val');
    let inputSelect = document.getElementById('inputs');
    let chordBtn = document.getElementById('chord-mode');
    let repeatBtn = document.getElementById('note-repeat');

    function connect() {
        if (!navigator.requestMIDIAccess) {
            return false;
        }

        navigator.requestMIDIAccess()
            .then(function(access) {
                let i = 0;
                access.inputs.forEach(function(input) {
                    inputs.push(input);
                    let option = document.createElement('option');
                    option.text = input.name;
                    option.value = i;
                    inputSelect.prepend(option);
                    i++;
                });
            });
    }

    function midiMsgReceived(event) {
        let cmd = event.data[0];
        let note = event.data[1];
        let velocity = event.data[2];

        if (chordMemory.length > 1 && chordBtn.classList.contains('btn-success')) {

            if (cmd === NOTE_ON) {
                playChord(note, velocity);
            } else {
                WebAudio.stop();
            }

        } else if (noteRepeat) {

            if (cmd === NOTE_ON) {
                WebAudio.play(note + octave, velocity);
                noteRepeatStart(note + octave, velocity);
            } else {
                noteRepeatStop();
            }

        } else {

            if (cmd === NOTE_ON) {
                WebAudio.play(note + octave, velocity);
            }

            if (cmd === NOTE_OFF) {
                WebAudio.stop(note + octave);
            }

            if (chordBtn.classList.contains('btn-danger')) {
                saveChord(cmd, note);
            }

        }
    }

    function saveChord(cmd, note) {
        if (cmd >= NOTE_ON && cmd < NOTE_ON + 16) {
            console.log('saving chord...');
            chordMemory.push(note);
        }
    }

    function playChord(note, velocity) {
        // root
        WebAudio.play(note + octave, velocity);

        // upper partials
        for (let i = 1; i < chordMemory.length; i++) {
            let interval = chordMemory[i] - chordMemory[0];
            WebAudio.play(note + octave + interval, velocity);
        }
    }

    function clearChord() {
        chordMemory = [];
    }

    function noteRepeatStart(note, velocity) {
        let ms = Math.round(60000 / bpm.value);

        // divide by subdivison value
        ms = ms / repeatVal.value;

        // duration for repeated note
        let duration = ms / 2;

        // stop initial note played
        setTimeout(function () { WebAudio.stop(note); }, duration);
        
        // start repeats
        let intervalId = setInterval(function () {
            WebAudio.play(note, velocity);
            setTimeout(function () { WebAudio.stop(note); }, duration);
        }, ms);

        noteRepeatIntervalIds.push(intervalId);
    }

    function noteRepeatStop() {
        for (let id of noteRepeatIntervalIds) {
            clearInterval(id);
        }
    }

    function octaveChange(value) {
        let newOctave = octave + parseInt(value);
        if (newOctave > 24 || newOctave < -24) {
            return false;
        }
        octave = newOctave;
    }

    function selectMidiIn() {
        inputs.forEach(function(input) {
            input.removeEventListener('midimessage', midiMsgReceived);
        });

        if (inputSelect.value === 'default') {
            virtualKeys = true;
        } else {
            virtualKeys = false;
            inputs[inputSelect.value].addEventListener('midimessage', midiMsgReceived);
        }
    }

    function removeItemFromKeyDown(item) {
        let index = keyDown.indexOf(item);
        if (index > -1) {
            keyDown.splice(index, 1);
        }
    }

    return {
        init: function() {
            // request midi access and find devices
            connect();
            
            // input selection
            inputSelect.addEventListener('change', selectMidiIn);

            // event handler for chord mode
            chordBtn.addEventListener('mousedown', function() {
                if (this.classList.contains('btn-success')) {
                    clearChord();
                    this.innerText = 'Save Chord';
                    this.classList.remove('btn-success');
                }
                this.classList.add('btn-danger');
            });

            chordBtn.addEventListener('mouseup', function() {
                this.classList.remove('btn-danger');
                if (chordMemory.length > 1) {
                    this.innerText = 'Clear Chord';
                    this.classList.add('btn-success');
                } else {
                    console.log('no chord...');
                }
            });

            // event handler for note repeat
            repeatBtn.addEventListener('mousedown', function() {
                noteRepeat = true;
                this.classList.add('btn-danger');
            });

            repeatBtn.addEventListener('mouseup', function() {
                noteRepeat = false;
                noteRepeatStop();
                this.classList.remove('btn-danger');
            });

            // event handler for octave buttons
            let octaveBtns = document.querySelectorAll('.octave .btn');
            octaveBtns.forEach(function(btn) {
                btn.addEventListener('mousedown', function(e) {
                    octaveChange(e.currentTarget.dataset.octave);
                    let btns = document.querySelectorAll('[data-octave]');
                    btns[0].classList.remove('btn-danger');
                    btns[1].classList.remove('btn-danger');
                    if (octave < 0) {
                        btns[0].classList.add('btn-danger');
                    } else if (octave > 0) {
                        btns[1].classList.add('btn-danger');
                    }
                });
            }); 

            // virtal keyboard event listeners
            let keys = document.querySelectorAll('.keys li');
            keys.forEach(function(key) {
                key.addEventListener('mousedown', function() {
                    if (!virtualKeys) { 
                        return false;
                    }
                    WebAudio.play(key.dataset.midi);
                });

                key.addEventListener('mouseup', function() {
                    if (!virtualKeys) {
                         return false;
                    }
                    WebAudio.stop();
                });
            });

            // physical keyboard events
            window.addEventListener('keydown', function(e) {
                if (!virtualKeys) { 
                    return false;
                }

                if (!keyDown.includes(keyMap[e.key])) {
                    if (e.key in keyMap) {
                        midiMsgReceived({data: [NOTE_ON, keyMap[e.key], 127]});
                        keyDown.push(keyMap[e.key]);
                        document.querySelector('[data-midi="' + keyMap[e.key] + '"]').classList.add('active');
                    }
                }
            });

            window.addEventListener('keyup', function(e) {
                if (!virtualKeys) { 
                    return false;
                }

                if (e.key in keyMap) {
                    midiMsgReceived({data: [NOTE_OFF, keyMap[e.key], 127]});
                    removeItemFromKeyDown(keyMap[e.key]);
                    document.querySelector('[data-midi="' + keyMap[e.key] + '"]').classList.remove('active');
                }
            });
        }
    };

})();

Midi.init();