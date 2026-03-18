///|
/// Color bleeding: shift I and Q channels spatially.
pub fn color_bleed(
  yiq : YiqFrame,
  field : Int,
  horiz : Int,
  vert : Int,
) -> Unit {
  let width = yiq.width
  let height = yiq.height
  // Shift I channel
  if vert > 0 || horiz > 0 {
    // Process rows in reverse to avoid overwriting source data
    // Vertical shift: copy from row-vert*2 (field-aware)
    // Horizontal shift: copy from col-horiz
    for row = height - 2 + field; row >= field; row = row - 2 {
      let i_off = yiq.i_offset(row)
      let q_off = yiq.q_offset(row)
      let src_row = row - vert * 2
      for col = width - 1; col >= 0; col = col - 1 {
        let src_col = col - horiz
        if src_row >= field && src_row < height && src_col >= 0 {
          let src_i_off = yiq.i_offset(src_row)
          let src_q_off = yiq.q_offset(src_row)
          yiq.data[i_off + col] = yiq.data[src_i_off + src_col]
          yiq.data[q_off + col] = yiq.data[src_q_off + src_col]
        } else {
          yiq.data[i_off + col] = 0
          yiq.data[q_off + col] = 0
        }
      }
    }
  }
}
