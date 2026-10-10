// Tiny N-API addon for macOS "game mode" presentation.
//
// Electron's simple full screen only AUTO-hides the Dock and menu bar, so they slide
// in whenever the pointer touches a screen edge. Kiosk mode hides them but also
// blocks Cmd+Tab. Real games set the presentation options themselves: hide the Dock
// and menu bar while the app is frontmost, and leave app switching alone. macOS
// applies these options only while this app is active, so other apps are unaffected.
#import <AppKit/AppKit.h>
#include <node_api.h>

static napi_value make_bool(napi_env env, bool v) {
  napi_value out;
  napi_get_boolean(env, v, &out);
  return out;
}

// setGameMode(on: boolean): boolean
static napi_value SetGameMode(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value argv[1];
  bool on = true;
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  if (argc > 0) napi_get_value_bool(env, argv[0], &on);
  NSApplicationPresentationOptions opts = on
    ? (NSApplicationPresentationHideDock | NSApplicationPresentationHideMenuBar)
    : NSApplicationPresentationDefault;
  @try {
    [NSApp setPresentationOptions:opts];
  } @catch (NSException *e) {
    return make_bool(env, false);
  }
  return make_bool(env, ([NSApp presentationOptions] & NSApplicationPresentationHideDock) != 0 || !on);
}

// isGameMode(): boolean (Dock and menu bar fully hidden right now)
static napi_value IsGameMode(napi_env env, napi_callback_info info) {
  NSApplicationPresentationOptions o = [NSApp presentationOptions];
  return make_bool(env, (o & NSApplicationPresentationHideDock) && (o & NSApplicationPresentationHideMenuBar));
}

// safeTop(): number, height in points hidden by the camera housing on notched displays.
static napi_value SafeTop(napi_env env, napi_callback_info info) {
  double top = 0;
  NSScreen *s = [NSScreen mainScreen];
  if (@available(macOS 12.0, *)) { if (s) top = s.safeAreaInsets.top; }
  napi_value out;
  napi_create_double(env, top, &out);
  return out;
}

NAPI_MODULE_INIT() {
  napi_property_descriptor props[] = {
    { "setGameMode", NULL, SetGameMode, NULL, NULL, NULL, napi_default, NULL },
    { "isGameMode", NULL, IsGameMode, NULL, NULL, NULL, napi_default, NULL },
    { "safeTop", NULL, SafeTop, NULL, NULL, NULL, napi_default, NULL },
  };
  napi_define_properties(env, exports, sizeof(props) / sizeof(props[0]), props);
  return exports;
}
