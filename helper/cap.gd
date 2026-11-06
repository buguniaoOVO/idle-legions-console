extends Node
## Idle Legions 多开中控 —— 运行时限帧钩子。
## 游戏只在启动时读 settings.cfg 的 max_fps；这个 autoload 每秒重读一次并写进 Engine.max_fps，
## 于是中控改完 settings.cfg 后 1 秒内就生效，不用重启游戏。

const DIR := "user://x1x_legions"
const CFG := "user://ventana_inicio.cfg"
const LINE := 'IdleLegionsCap="*user://x1x_legions/cap.gd"'
const SETTINGS := "user://settings.cfg"
const LOGF := "user://x1x_legions/cap.log"

var _t := 0.0
var _last := -1


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	ensure_cfg()
	_apply()


func _process(delta: float) -> void:
	_t += delta
	if _t >= 1.0:
		_t = 0.0
		ensure_cfg()
		_apply()


func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST or what == NOTIFICATION_PREDELETE:
		ensure_cfg()


## 游戏自己会重写 ventana_inicio.cfg（保存窗口位置），这行丢了就补回去
func ensure_cfg() -> void:
	var text := FileAccess.get_file_as_string(CFG) if FileAccess.file_exists(CFG) else ""
	if text.find(LINE) >= 0:
		return
	if text.find("[autoload]") >= 0:
		text = text.replace("[autoload]", "[autoload]\n\n" + LINE)
	else:
		text = text.strip_edges(false, true) + "\n\n[autoload]\n\n" + LINE + "\n"
	var f := FileAccess.open(CFG, FileAccess.WRITE)
	if f != null:
		f.store_string(text)
		f.close()


func _apply() -> void:
	var c := ConfigFile.new()
	if c.load(SETTINGS) != OK:
		return
	var fps := int(c.get_value("video", "max_fps", 0))
	if fps == _last:
		return
	_last = fps
	Engine.max_fps = fps
	_log("max_fps -> %d" % fps)


func _log(line: String) -> void:
	var f := FileAccess.open(LOGF, FileAccess.READ_WRITE)
	if f == null:
		f = FileAccess.open(LOGF, FileAccess.WRITE)
	if f == null:
		return
	f.seek_end()
	f.store_line("%s %s" % [Time.get_datetime_string_from_system(), line])
	f.close()
