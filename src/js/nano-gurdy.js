/* globals Tone */
(function (fluid, flock, Tone, Nexus) {
    "use strict";
    var nanogurdy = fluid.registerNamespace("nanogurdy");

    // Tunings adapted from: https://www.altarwind.com/hgtuning.html

    // Drone notes are tuned G2, D2, D1


    // All notes struck on pads determine the "chanting" note, which is in theory tuned higher, but not limited here
    // yet.
    // TODO: considering retuning and limiting to one each chanted note for "chromatic" and "natural" scale.


    // TODO: Visualise drone notes as strings that vibrate when the wheel is moving, in proportion to the speed.

    // TODO: Visualise the wheel.

    // TODO: Visualize chromatic notes as strings that vibrate from the position of the held note.

    // Use pitchbend to control the volume because it naturally returns to zero when released.
    nanogurdy.handlePitchbend =  function (that, midiMessage) {
        var deflection = Math.abs(midiMessage.value - 8192);
        var newVolume = (deflection / 8192);
        that.applier.change("volume", newVolume);
    };

    nanogurdy.handleNote = function (that, midiMessage) {
        var frequency = Tone.Midi(midiMessage.note).toFrequency();

        if (midiMessage.type === "noteOn" && midiMessage.velocity > 0) {
            that.heldChanterelleNotes[frequency] = true;
        }
        else {
            delete that.heldChanterelleNotes[frequency];
        }

        var frequenciesInDescendingOrder = Object.keys(that.heldChanterelleNotes).sort(function (a, b) {
            return parseInt(b, 10) - parseInt(a,10);
        });

        if (frequenciesInDescendingOrder.length) {
            var highestFrequency = frequenciesInDescendingOrder[0];
            if (that.lastHeldChanterelleNote !== highestFrequency) {
                // that.chanterelle.triggerRelease();
                that.chanterelle.triggerAttack(highestFrequency);
                that.lastHeldChanterelleNote = highestFrequency;
            }
        }
        else {
            that.chanterelle.triggerRelease();
            that.lastHeldChanterelleNote = false;
        }
    };

    nanogurdy.renderAndFireEvent = function (that, template, event) {
        var htmlContent = fluid.stringTemplate(template, that.model);
        that.container.html(htmlContent);

        if (event) {
            event.fire(that);
        }
    };

    nanogurdy.wireUpNexus = function (that) {
        // https://github.com/nexus-js/ui/issues/89
        // Nexus.context = Tone.context;
        Nexus.colors = that.options.nexusColors;

        // drone rack
        var droneControls = new Nexus.Rack("#drone-control-rack");
        droneControls.volume.value = that.model.drone.volume;
        droneControls.volume.on('change',  function (newValue) { that.applier.change('drone.volume', newValue)});
        droneControls.dampening.value = that.model.drone.dampening;
        droneControls.dampening.on('change',  function (newValue) { that.applier.change('drone.dampening', newValue)});
        droneControls.resonance.value = that.model.drone.resonance;
        droneControls.volume.on('change',  function (newValue) { that.applier.change('drone.resonance', newValue)});
        droneControls.attackNoise.value = that.model.drone.attackNoise;
        droneControls.attackNoise.on('change',  function (newValue) { that.applier.change('drone.attackNoise', newValue)});

        // chanterelle rack
        var chanterelleControls = new Nexus.Rack("#chanterelle-control-rack");
        chanterelleControls.volume.value = that.model.chanterelle.volume;
        chanterelleControls.volume.on('change',  function (newValue) { that.applier.change('chanterelle.volume', newValue)});
        chanterelleControls.dampening.value = that.model.chanterelle.dampening;
        chanterelleControls.dampening.on('change',  function (newValue) { that.applier.change('chanterelle.dampening', newValue)});
        chanterelleControls.resonance.value = that.model.chanterelle.resonance;
        chanterelleControls.volume.on('change',  function (newValue) { that.applier.change('chanterelle.resonance', newValue)});
        chanterelleControls.attackNoise.value = that.model.chanterelle.attackNoise;
        chanterelleControls.attackNoise.on('change',  function (newValue) { that.applier.change('chanterelle.attackNoise', newValue)});
    };

    nanogurdy.createInstruments = function (that, event) {
        that.chanterelleGain = new Tone.Gain(that.model.volume).toDestination();
        that.droneGain = new Tone.Gain(that.model.volume).toDestination();

        that.drone = new Tone.PolySynth(Tone.PluckSynth, {
            dampening: that.model.drone.dampening,
            attackNoise: that.model.drone.attackNoise,
            resonance: that.model.drone.resonance
        }).connect(that.droneGain);
        fluid.each(that.options.droneNotes, function (droneNote) {
            var drone = new Tone.PluckSynth({
                dampening: that.model.drone.dampening,
                attackNoise: that.model.drone.attackNoise,
                resonance: that.model.drone.resonance
            }).connect(that.droneGain);
            that.drones.push({ pitch: droneNote, drone: drone});
        });

        that.chanterelle = new Tone.PluckSynth({
            dampening: that.model.chanterelle.dampening,
            attackNoise: that.model.chanterelle.attackNoise,
            resonance: that.model.chanterelle.resonance
        }).connect(that.chanterelleGain);
    };

    nanogurdy.updateVolume = function (that, change) {
        that.chanterelleGain.gain.rampTo(that.model.volume * that.model.chanterelle.volume, that.options.gainRampTime);
        that.droneGain.gain.rampTo(that.model.volume * that.model.drone.volume, that.options.gainRampTime);

        if (change.oldValue === 0) {
            nanogurdy.strikeDrones(that);
        }
        else if (change.newValue === 0) {
            nanogurdy.silenceDrones(that);
        }
    };

    nanogurdy.updateDroneVolume = function (that) {
        that.droneGain.gain.rampTo(that.model.volume * that.model.drone.volume, 0);
    };

    nanogurdy.updateDroneDampening = function (that) {
        that.drone.options.dampening = that.model.drone.dampening;
    };

    nanogurdy.updateDroneResonance = function (that) {
        that.drone.resonance = that.model.drone.resonance;
    };

    nanogurdy.updateDroneAttackNoise = function (that) {
        that.drone.attackNoise = that.model.drone.attackNoise;
    };

    nanogurdy.updateChanterelleVolume = function (that) {
        that.chanterelleGain.gain.rampTo(that.model.volume * that.model.chanterelle.volume, 0);
    };

    nanogurdy.updateChanterelleDampening = function (that) {
        that.chanterelle.options.dampening = that.model.chanterelle.dampening;
    };

    nanogurdy.updateChanterelleResonance = function (that) {
        that.chanterelle.resonance = that.model.chanterelle.resonance;
    };

    nanogurdy.updateChanterelleAttackNoise = function (that) {
        that.chanterelle.attackNoise = that.model.chanterelle.attackNoise;
    };

    nanogurdy.strikeDrones  = function (that) {
        fluid.each(that.drones, function (droneRecord) {
            droneRecord.drone.triggerAttack(droneRecord.pitch);
        });
    };

    nanogurdy.silenceDrones  = function (that) {
        fluid.each(that.drones, function (droneRecord) {
            droneRecord.drone.triggerRelease();
        });
    };


    fluid.defaults("nanogurdy", {
        gradeNames: ["fluid.viewComponent"],
        preferredInputDevice: "Akai MAX49 Port A",
        // preferredInputDevice: "nanoPAD2 PAD",
        events: {
            pitchbend: null,
            note:  null,
            onMainUiRendered: null
        },
        model: {
            volume: 1,
            drone: {
                attackNoise: 5,
                dampening: 65,
                resonance: 0.9999,
                volume: 0.4
            },
            chanterelle: {
                attackNoise: 5,
                dampening: 250,
                resonance: 0.999,
                volume: 1
            }
        },
        members: {
            chanterelle: false,
            chanterelleGain: false,
            droneGain: false,
            drones: [],
            lastHeldChanterelleNote: false,
            heldChanterelleNotes: {}
        },
        droneNotes: ["G3", "D3", "D2"],
        gainRampTime: 0.5,
        nexusColors: {
            accent: "#fff",
            fill: "#000",
            light: "#fff",
            mediumLight: "#ccc",
            mediumDark: "#999",
            dark: "#333",
        },
        selectors: {
            noteInput: ".note-input",
            toneStartButton: ".tone-start-button"
        },
        templates: {
            main:
                "<div class='nano-gurdy'>\n" +
                "  <h2>Drone</h2>\n" +
                "  <div class='controlRack' id='drone-control-rack'>\n" +
                "    <div><div nexus-ui='dial' id='volume' min='0' max='1'/><div class='dialLabel'>Vol</div></div>\n" +
                "    <div><div nexus-ui='dial' id='dampening' min='0' max='7000'/><div class='dialLabel'>Damp</div></div>\n" +
                "    <div><div nexus-ui='dial' id='resonance' min='0' max='1'/><div class='dialLabel'>Res</div></div>\n" +
                "    <div><div nexus-ui='dial' id='attackNoise' min='1' max='20'/><div class='dialLabel'>Noise</div></div>\n" +
                "  </div>\n" +
                "  <h2>Chanterelle</h2>\n" +
                "  <div class='controlRack' id='chanterelle-control-rack'>\n" +
                "    <div><div nexus-ui='dial' id='volume' min='0' max='1'/><div class='dialLabel'>Vol</div></div>\n" +
                "    <div><div nexus-ui='dial' id='dampening' min='0' max='7000'/><div class='dialLabel'>Damp</div></div>\n" +
                "    <div><div nexus-ui='dial' id='resonance' min='0' max='1'/><div class='dialLabel'>Res</div></div>\n" +
                "    <div><div nexus-ui='dial' id='attackNoise' min='1' max='20'/><div class='dialLabel'>Noise</div></div>\n" +
                "  </div>\n" +
                "  <div class='note-input'></div>\n" +
                "</div>"
        },
        components: {
            noteInput: {
                type: "flock.midi.connectorView",
                container: "{that}.dom.noteInput",
                createOnEvent: "{that}.events.onMainUiRendered",
                options: {
                    preferredPort: "{nanogurdy}.options.preferredInputDevice",
                    portType: "input",
                    components: {
                        midiPortSelector: {
                            options: {
                                strings: {
                                    selectBoxLabel: "Note Input",
                                }
                            }
                        }
                    },
                    listeners: {
                        "pitchbend.notifyParent": {
                            func: "{nanogurdy}.events.pitchbend.fire"
                        },
                        "note.notifyParent": {
                            func: "{nanogurdy}.events.note.fire"
                        },
                    }
                }
            }
        },
        listeners: {
            "onCreate.createInstruments": {
                funcName: "nanogurdy.createInstruments",
                args: ["{that}", "{arguments}.0"] //event
            },
            "onCreate.renderMainUI": {
                funcName: "nanogurdy.renderAndFireEvent",
                args: ["{that}", "{that}.options.templates.main", "{that}.events.onMainUiRendered"]
            },
            "onMainUiRendered.wireUpNexus": {
                funcName: "nanogurdy.wireUpNexus",
                args: ["{that}"]
            },
            "pitchbend": {
                funcName: "nanogurdy.handlePitchbend",
                args: ["{that}", "{arguments}.0"] // midiMessage
            },
            note:  {
                funcName: "nanogurdy.handleNote",
                args: ["{that}", "{arguments}.0"] // midiMessage
            }
        },
        invokers: {
            strikeDrones: {
                funcName: "nanogurdy.strikeDrones",
                args: ["{that}"]
            }
        },
        modelListeners: {
            volume: {
                excludeSource: "init",
                funcName: "nanogurdy.updateVolume",
                args: ["{that}", "{change}"]
            },
            "drone.volume": {
                excludeSource: "init",
                funcName: "nanogurdy.updateDroneVolume",
                args: ["{that}"]
            },
            "drone.resonance": {
                excludeSource: "init",
                funcName: "nanogurdy.updateDroneResonance",
                args: ["{that}"]
            },
            "drone.attackNoise": {
                excludeSource: "init",
                funcName: "nanogurdy.updateDroneAttackNoise",
                args: ["{that}"]
            },
            "chanterelle.volume": {
                excludeSource: "init",
                funcName: "nanogurdy.updateChanterelleVolume",
                args: ["{that}"]
            },
            "chanterelle.resonance": {
                excludeSource: "init",
                funcName: "nanogurdy.updateChanterelleResonance",
                args: ["{that}"]
            },
            "chanterelle.attackNoise": {
                excludeSource: "init",
                funcName: "nanogurdy.updateChanterelleAttackNoise",
                args: ["{that}"]
            }
        }
    });
})(fluid, flock, Tone, Nexus);
