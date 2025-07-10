import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingDepensesComponent } from './setting-depenses.component';

describe('SettingDepensesComponent', () => {
  let component: SettingDepensesComponent;
  let fixture: ComponentFixture<SettingDepensesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingDepensesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingDepensesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
