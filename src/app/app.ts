import { Component, signal } from '@angular/core';
import { CustomerComponent } from './components/customer-page/customer-page';

@Component({
  selector: 'app-root',
  imports: [CustomerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
 
}
