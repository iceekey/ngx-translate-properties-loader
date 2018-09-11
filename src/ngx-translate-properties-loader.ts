import { parse } from './properties-parser';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

export class TranslateHttpPropertiesLoader {
  constructor(private http: HttpClient, private prefix: string, private suffix: string) {
    if (typeof prefix !== 'string') {
      prefix = '/assets/i18n/';
    }

    if (typeof suffix !== 'string') {
      suffix = '.json';
    }
  }

  getTranslation(lang) {
    if (this.suffix === '.properties') {
      return this.http
        .get('' + this.prefix + lang + this.suffix, { responseType: 'text' })
        .pipe(map(this.convertProps.bind(this)));
    } else {
      return this.http.get('' + this.prefix + lang + this.suffix);
    }
  }

  convertProps(props) {
    const flatProps = parse(props);
    const inflated = {};

    for (let key in flatProps) {
      if (Object.prototype.hasOwnProperty.call(flatProps, key)) {
        let item = inflated;
        const splitKey = key.split('.');

        for (let i = 0; i < splitKey.length - 1; i++) {
          var part = splitKey[i];

          if (!item[part]) {
            item[part] = {};
          }

          item = item[part];
        }

        const last = splitKey[splitKey.length - 1];

        if (typeof item[last] !== 'undefined') {
          throw new Error(
            'Failed to convert .properties to JSON. ' +
              'Property ' +
              splitKey.join('.') +
              ' is already assigned or contains nested properties.'
          );
        }

        item[last] = flatProps[key];
      }
    }
    return inflated;
  }
}
