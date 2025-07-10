import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Country {
  name: {
    common: string;
    official: string;
  };
  cca2: string; // Country code (2 letters)
  cca3: string; // Country code (3 letters)
  flag: string; // Flag emoji
}

@Injectable({
  providedIn: 'root'
})
export class CountriesService {
  private apiUrl = 'https://restcountries.com/v3.1/all';

  constructor(private http: HttpClient) { }

  getAllCountries(): Observable<Country[]> {
    return this.http.get<Country[]>(this.apiUrl).pipe(
      map(countries => countries.sort((a, b) => a.name.common.localeCompare(b.name.common)))
    );
  }
}
