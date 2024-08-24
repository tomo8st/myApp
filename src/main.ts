import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { MAT_DATE_LOCALE, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MAT_DATE_FNS_FORMATS, MatDateFnsModule } from '@angular/material-date-fns-adapter';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { ja } from 'date-fns/locale';


bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserAnimationsModule,
      HttpClientModule,
      MatDateFnsModule
    ),
    provideRouter(routes),
    { provide: MAT_DATE_LOCALE, useValue: ja },

  ]
}).catch(err => console.error(err));