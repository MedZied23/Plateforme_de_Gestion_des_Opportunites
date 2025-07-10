import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionProfilsComponent } from './gestion-profils.component';

describe('GestionProfilsComponent', () => {
  let component: GestionProfilsComponent;
  let fixture: ComponentFixture<GestionProfilsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionProfilsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionProfilsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
