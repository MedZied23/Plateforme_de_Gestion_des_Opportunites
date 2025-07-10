import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialNavigationComponent } from './financial-navigation.component';

describe('FinancialNavigationComponent', () => {
  let component: FinancialNavigationComponent;
  let fixture: ComponentFixture<FinancialNavigationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialNavigationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
