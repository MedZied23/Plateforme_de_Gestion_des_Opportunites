import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayFeuilOneComponent } from './display-feuil-one.component';

describe('DisplayFeuilOneComponent', () => {
  let component: DisplayFeuilOneComponent;
  let fixture: ComponentFixture<DisplayFeuilOneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayFeuilOneComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplayFeuilOneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
