# "Nano Gurdy"

An approximation of a hurdy gurdy with three drone notes and a single chanter, written using Tone.js, NexusUI,
flocking-midi, and infusion. It can only run in a browser that supports the WebMIDI API (Chrome and derivatives at time
of writing).

# Starting this software

Because of the way in which local content is "sandboxed" in Chrome, the demonstration included here cannot be run
simply by opening `index.html` in a browser.  The easiest way to test local changes is to host it somewhere, for
example by using python, as in:

`python -m SimpleHTTPServer`

You can also see a copy of this demo [on my GitHub pages](https://duhrer.github.io/demos/nano-gurdy/).

# Instructions

First, click the "start" button to launch the WebAudio context and render the demo.  You should see a series of
dials and dropdowns appear.

This demonstration requires a MIDI controller that has a pitchbend.  At the bottom of the screen is a dropdown showing
the currently connected MIDI controllers, select yours from the list. 

The pitchbend deflection from centre controls the "crank", i.e. no sound is produced when the pitchbend is at rest.  Try
holding the pitchbend fully up or down, and wait for the "crank" to come up to speed.

You will hear the three drone notes, which play whenever the "crank" is turning.

There is a final voice, the "chanterelle".  The highest note currently held on the controller will be played using the
chanterelle.  This is meant to mimic the behaviour of a stringed device, where multiple frets may be held on the same
string in anticipation of making rapid changes.  Unlike a plucked instrument like a guitar, the volume of the
chanterelle always corresponds to the speed of the turn, and does not change when performing a "hammer on" or
"pull off".

The onscreen controls let you adjust the volume of the drones and chanter, and the key parameters of the underlying
PluckSynth provided by Tone.js.
