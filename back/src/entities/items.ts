class Item extends StatMod {
  constructor(name) {
    super(name);
    this.icon = "❓";
    this.uses = 0;
    this.player = "";
    this.tradable = true;
    this.stealable = true;
    this.replacable = true;
    this.value = 1;
  }

  get_value() {
    return this.value * this.uses;
  }

  equip(player) {
    this.player = player;
    // this.player.lastAction = "found " + this.name;
    this.calc_bonuses();
    this.player.statusMessage = "found " + this.name;
    return true;
  }

  use() {
    this.uses--;
    if (this.uses == 0) {
      this.destroy();
    }
  }

  show_info() {
    let item_info =
      "<div class='info'>" +
      "<b style='font-size:18px'>" +
      this.icon +
      " " +
      this.display_name +
      "</b><br>" +
      "<span style='font-size:12px'>" +
      this.player.name +
      "</span><br>" +
      "<span><b>Uses:</b>" +
      this.uses +
      "</span><br>" +
      this.stat_html() +
      "</div>";

    $("#extra_info_container").html(item_info);
  }

  drop() {
    let coords = [500, 500];
    if (this.player) coords = [this.player.x, this.player.y];
    let uneq = this.unequip();
    if (uneq && this.tradable) {
      let drop = new DroppedItemEntity(coords[0], coords[1], this);
      createDoodad(drop);
    }
    return uneq;
  }

  destroy() {
    if (extra_info_obj == this) {
      deselect_extra_info();
    }
    this.player = "";
  }
}
