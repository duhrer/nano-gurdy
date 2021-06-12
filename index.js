/* eslint-env node */
"use strict";
var fluid = require("infusion");

// Register our content so it can be used with calls like fluid.module.resolvePath("%nano-gurdy/path/to/content.js");
fluid.module.register("nano-gurdy", __dirname, require);
