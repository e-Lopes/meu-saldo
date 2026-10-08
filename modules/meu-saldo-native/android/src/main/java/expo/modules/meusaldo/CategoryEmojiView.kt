package expo.modules.meusaldo

import android.content.Context
import android.text.InputFilter
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.util.TypedValue
import android.widget.LinearLayout
import androidx.appcompat.widget.AppCompatEditText
import androidx.appcompat.widget.AppCompatTextView
import androidx.core.widget.doAfterTextChanged
import androidx.emoji2.bundled.BundledEmojiCompatConfig
import androidx.emoji2.text.EmojiCompat
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

// A bundled font also works offline and on phones with an older system emoji font.
class CategoryEmojiView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  override val shouldUseAndroidLayout = true
  private val onChangeText by EventDispatcher()
  private var changing = false
  private val label: AppCompatTextView
  private val editor: AppCompatEditText

  init {
    if (!EmojiCompat.isConfigured()) {
      EmojiCompat.init(BundledEmojiCompatConfig(context).setReplaceAll(true))
    }
    label = AppCompatTextView(context).apply {
      gravity = Gravity.CENTER
      includeFontPadding = true
      setPadding(0, 0, 0, 0)
      importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
    }
    editor = AppCompatEditText(context).apply {
      background = null
      setSingleLine(true)
      inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
      filters = arrayOf(InputFilter.LengthFilter(32))
      contentDescription = "Usar emoji"
      setPadding(0, 0, 0, 0)
      visibility = View.GONE
      doAfterTextChanged { if (!changing) onChangeText(mapOf("text" to it.toString())) }
    }
    orientation = LinearLayout.VERTICAL
    addView(label, LinearLayout.LayoutParams(-1, -1))
    addView(editor, LinearLayout.LayoutParams(-1, -1))
  }

  fun setValue(value: String) {
    label.text = value
    if (editor.text.toString() != value) {
      changing = true
      editor.setText(value)
      editor.setSelection(editor.text?.length ?: 0)
      changing = false
    }
  }
  fun setInput(input: Boolean) {
    label.visibility = if (input) View.GONE else View.VISIBLE
    editor.visibility = if (input) View.VISIBLE else View.GONE
  }
  fun setEditable(editable: Boolean) { editor.isEnabled = editable }
  fun setTextColor(color: Int) { label.setTextColor(color); editor.setTextColor(color) }
  fun setFontSize(size: Float) {
    label.setTextSize(TypedValue.COMPLEX_UNIT_DIP, size)
    editor.textSize = size
  }
}
