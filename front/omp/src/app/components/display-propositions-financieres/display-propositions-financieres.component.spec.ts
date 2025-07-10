import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayPropositionsFinancieresComponent } from './display-propositions-financieres.component';

describe('DisplayPropositionsFinancieresComponent', () => {
  let component: DisplayPropositionsFinancieresComponent;
  let fixture: ComponentFixture<DisplayPropositionsFinancieresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayPropositionsFinancieresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplayPropositionsFinancieresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
