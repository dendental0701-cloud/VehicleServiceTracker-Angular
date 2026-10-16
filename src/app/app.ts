import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
  standalone: true
})
export class App {
  protected readonly title = signal('vehicle-service-tracker-angular');
}



// Why do we need RouterOutlet?

// It provides the location where Angular renders the component matched by the current route.