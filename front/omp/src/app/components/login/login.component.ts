import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  login: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.login || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      console.log('Login attempt failed: Empty fields');
      return;
    }
    
    console.log('Attempting login with email:', this.login);
    this.authService.login(this.login, this.password).subscribe({
      next: (response) => {
        console.log('Login successful!', response);
        console.log('User role:', response.role);
        console.log('Redirecting to dashboard...');
        this.router.navigate(['/layout']);
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.errorMessage = 'Email ou mot de passe incorrect';
      }
    });
  }
}
