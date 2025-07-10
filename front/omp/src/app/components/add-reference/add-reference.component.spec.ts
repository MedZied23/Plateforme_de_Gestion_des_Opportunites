import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddReferenceComponent } from './add-reference.component';

describe('AddReferenceComponent', () => {
  let component: AddReferenceComponent;
  let fixture: ComponentFixture<AddReferenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddReferenceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddReferenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
