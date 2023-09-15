function proxyGlMethod(tracker, glMethodName, proxyMethod) {
  tracker.gl[glMethodName] = new Proxy(tracker.gl[glMethodName], {  
    apply: function(target, thisArg, argumentsList) {
      proxyMethod.call(tracker, argumentsList)
      return Reflect.apply(...arguments)
    }
  })
}
                                     
class GLStateTracker {  
  static glStateNameToGlMethodNameTable = {}
  static glStateNameToSaveMethodTable = {}
  static glStateNameToRestoreMethodTable = {}
  static setTrackerMethods(glStateName, glMethodName, saveMethod, restoreMethod) { GLStateTracker.glStateNameToGlMethodNameTable[glStateName] = glMethodName; GLStateTracker.glStateNameToSaveMethodTable[glStateName] = saveMethod; GLStateTracker.glStateNameToRestoreMethodTable[glStateName] = restoreMethod } 
  constructor(gl, stateNameList) {
    this.gl = gl
    this.stateMap = new Map()
    this.stateNames = this.stateNameList
    for (let stateName of stateNameList) {
      proxyGlMethod(this, GLStateTracker.glStateNameToGlMethodNameTable[stateName], GLStateTracker.glStateNameToSaveMethodTable[stateName])
    }
  }
  saveState(glStateName, glState) {
    if (this.tracking) {this.stateMap.set(glStateName, glState) }
  }
  restoreState(glStateName) { GLStateTracker.glStateNameToRestoreMethodTable[glStateName].call(this, this.stateMap.get(glStateName)) }
  startTracking() {this.tracking = true}
  stopTracking() {this.tracking = false}
  restore() {
    this.stateNameList.forEach(stateName => this.restoreState(stateName))
  }
}

GLStateTracker.setTrackerMethods(
  WebGLRenderingContext.VIEWPORT, 
  "viewport",
  function(args) { this.saveState(WebGLRenderingContext.VIEWPORT, args)}, 
  function(viewport) {this.gl.viewport(...viewport)}
)
GLStateTracker.setTrackerMethods(
  WebGLRenderingContext.ACTIVE_TEXTURE,
  "activeTexture",
  function(args) { this.saveState(WebGLRenderingContext.ACTIVE_TEXTURE, args) },
  function(activeTexture) { this.gl.activeTexture(...activeTexture)} 
) 
GLStateTracker.setTrackerMethods(
  WebGLRenderingContext.CURRENT_PROGRAM, 
  "useProgram", 
  function(args) { this.saveState(WebGLRenderingContext.CURRENT_PROGRAM, args) }, 
  function(program) { this.gl.useProgram(...program) }
)
GLStateTracker.setTrackerMethods(
  "BLEND_FUNC_SEPARATE",
  "blendFuncSeparate",
  function(args) { this.saveState("BLEND_FUNC_SEPARATE", args) },
  function(args) { this.gl.blendFuncSeparate(...args) }
)
GLStateTracker.setTrackerMethods(
  "GENERIC_ENABLE", 
  "enable",
  function(args) { 
    if (!this.stateMap.has("GENERIC")) {this.stateMap.set("GENERIC", new Map())}
    if (this.tracking) {this.stateMap.get("GENERIC").set(...args, true)}
  },
  function(state) {
    let genericMap = this.stateMap.get("GENERIC")
    if (genericMap) {
      [...genericMap.keys()].forEach(key => { 
        if (genericMap.get(key)) {this.gl.enable(key)}
      })
    }
  }
)
GLStateTracker.setTrackerMethods(
"GENERIC_DISABLE",
"disable",
function(args) {
  if (!this.stateMap.has("GENERIC")) {this.stateMap.set("GENERIC", new Map())}
  if (this.tracking) {this.stateMap.get("GENERIC").set(...args, false)}
},
function(state) {
  let genericMap = this.stateMap.get("GENERIC")
  if (genericMap) {
    [...genericMap].keys().forEach(key => {
      if (!genericMap.get(key)) {this.gl.disable(key)}
    })
  }
}
);
   
////test 
   
