function proxyGlMethod(tracker, glMethodName, proxyMethod) {
  tracker.gl[glMethodName] = new Proxy(tracker.gl[glMethodName], {  
    apply: function(target, thisArg, argumentsList) {=
      proxyMethod.call(tracker, argumentsList)
      return Reflect.apply(...arguments)
    }
  })
}

class GLStateTracker {
  static glStateNameToGlMethodNameTable = {}
  static glStateNameToSaveMethodTable = {}
  static glStateNameToRestoreMethodTable = {}
  static setTrackerMethods(glStateName, glMethodName, saveMethod, restoreMethod) { GLStateTracker.glStateNameToGlMethodNameTable[glStateName] = glMethodName; GLStateTracker.glStateNameToSaveMethodTable[glStateName] = saveMethod; GLStateTracker.glStateToRestoreMethodTable[glStateName] = restoreMethod } 
  constructor(gl, stateNameList) {
    this.gl = gl
    this.stateMap = new Map()
    for (let stateName of stateNameList) {
      proxyGlMethod(this, GLStateTracker.glStateNameToGlMethodNameTable[stateName], GLStateTracker.glStateToSaveMethodTable[stateName])
    }
  }
  saveState(glStateName, glState) {
    if (this.tracking) {this.stateMap.set(glStateName, glState) }
  }
  restoreState(glStateName) { GLStateTracker.glStateToRestoreMethodTable[glStateName].call(this, this.stateMap.get(glStateName) }
  startTracking() {this.tracking = true}
  stopTracking() {this.tracking = false}
}

GLStateTracker.setTrackerMethods(
  WebGLRenderingContext.VIEWPORT, 
  "viewport",
  function(args) { this.saveState(WebGLRenderingContext.VIEWPORT, args)}, 
  function(viewport) {this.gl.viewport(...viewport)}
)

////test 
