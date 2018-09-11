# @ngx-translate/http-properties-loader

Http loader for properties files in @ngx-translate (i18n) library for **Angular 6 or higher**.

## Installation

Install `@ngx-translate/core` and `ngx-translate-properties-loader` into your project:

```bash
  npm i "@ngx-translate/core" ngx-translate-properties-loader
```

## Usage

### 1. Create `HttpLoaderFactory`:

```typescript
import { TranslateHttpPropertiesLoader } from 'ngx-translate-properties-loader';


export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpPropertiesLoader(http, './localization/messages_', '.properties');
}
```

### 2. Use `HttpLoaderFactory` in your `TranslateModule`:

```typescript

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
    imports: [
      BrowserModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
```

Enjoy!
