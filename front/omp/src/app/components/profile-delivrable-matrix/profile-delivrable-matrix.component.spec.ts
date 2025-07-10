import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileDelivrableMatrixComponent } from './profile-delivrable-matrix.component';

describe('ProfileDelivrableMatrixComponent', () => {
  let component: ProfileDelivrableMatrixComponent;
  let fixture: ComponentFixture<ProfileDelivrableMatrixComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileDelivrableMatrixComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileDelivrableMatrixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
