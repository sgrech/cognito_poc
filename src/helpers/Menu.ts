export class Menu {
  private menu: string = "";

  static init() {
    return new Menu();
  }

  addMenuItem(item: [number, string]): Menu {
    const [key, value] = item;
    this.menu = `${this.menu}${key}) ${value}\n`;
    return this;
  }

  get menu_list() {
    return `${this.menu}>`;
  }
}

