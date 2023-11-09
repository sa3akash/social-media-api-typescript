/* eslint-disable @typescript-eslint/no-explicit-any */
import { floor, random } from 'lodash';

export class Utils {
  static generateRandomCode(length: number): number {
    let code = '';
    const schema = '0123456789';

    for (let i = 0; i < length; i++) {
      code += schema.charAt(Math.floor(Math.random() * schema.length));
    }
    return Number(code);
  }

  static generateRandomIntegers(integerLength: number): number {
    const characters = '0123456789';
    let result = ' ';
    const charactersLength = characters.length;
    for (let i = 0; i < integerLength; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return parseInt(result, 10);
  }

  static generateRandomString(length: number): string {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

  static generateColor(): string {
    const colors: string[] = [
      '#f44336',
      '#e91e63',
      '#2196f3',
      '#9c27b0',
      '#3f51b5',
      '#00bcd4',
      '#4caf50',
      '#ff9800',
      '#8bc34a',
      '#009688',
      '#03a9f4',
      '#cddc39',
      '#2962ff',
      '#448aff',
      '#84ffff',
      '#00e676',
      '#43a047',
      '#d32f2f',
      '#ff1744',
      '#ad1457',
      '#6a1b9a',
      '#1a237e',
      '#1de9b6',
      '#d84315'
    ];
    return colors[floor(random(0.9) * colors.length)];
  }

  static parseJson(prop: string): any {
    try {
      return JSON.parse(prop);
    } catch (err) {
      return prop;
    }
  }
}
