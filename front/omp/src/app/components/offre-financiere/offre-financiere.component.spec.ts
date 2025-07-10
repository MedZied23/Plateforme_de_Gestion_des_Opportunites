import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OffreFinanciereComponent } from './offre-financiere.component';

describe('OffreFinanciereComponent', () => {
  let component: OffreFinanciereComponent;
  let fixture: ComponentFixture<OffreFinanciereComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OffreFinanciereComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OffreFinanciereComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
