import os
import pytest
from django.test import TestCase
from operations.models import Workflow, WorkflowStep, ClientKYC, FieldCollection


class WorkflowModelTestCase(TestCase):
    """Test cases for Workflow model."""

    def setUp(self):
        """Set up test data."""
        from users.models import User
        self.user = User.objects.create_user(
            email='workflow_test@example.com',
            first_name='Workflow',
            last_name='Test',
            role='operations_manager',
            password=os.getenv('TEST_USER_PASSWORD', 'test123')
        )

    def test_create_workflow(self):
        """Test creating a workflow."""
        workflow = Workflow.objects.create(
            name='Test Workflow',
            description='Test workflow description',
            created_by=self.user
        )
        self.assertEqual(workflow.name, 'Test Workflow')
        self.assertEqual(workflow.description, 'Test workflow description')
        self.assertEqual(workflow.created_by, self.user)
        self.assertTrue(workflow.is_active)

    def test_workflow_str_representation(self):
        """Test string representation of Workflow."""
        workflow = Workflow.objects.create(
            name='Test Workflow',
            created_by=self.user
        )
        self.assertEqual(str(workflow), 'Test Workflow')


class WorkflowStepModelTestCase(TestCase):
    """Test cases for WorkflowStep model."""

    def setUp(self):
        """Set up test data."""
        from users.models import User
        self.user = User.objects.create_user(
            email='step_test@example.com',
            first_name='Step',
            last_name='Test',
            role='operations_manager',
            password=os.getenv('TEST_USER_PASSWORD', 'test123')
        )
        self.workflow = Workflow.objects.create(
            name='Test Workflow',
            created_by=self.user
        )

    def test_create_workflow_step(self):
        """Test creating a workflow step."""
        step = WorkflowStep.objects.create(
            workflow=self.workflow,
            name='Test Step',
            description='Test step description',
            order=1,
            required_role='mobile_banker',
            is_required=True
        )
        self.assertEqual(step.workflow, self.workflow)
        self.assertEqual(step.name, 'Test Step')
        self.assertEqual(step.order, 1)
        self.assertEqual(step.required_role, 'mobile_banker')
        self.assertTrue(step.is_required)

    def test_workflow_step_str_representation(self):
        """Test string representation of WorkflowStep."""
        step = WorkflowStep.objects.create(
            workflow=self.workflow,
            name='Test Step',
            order=1,
            required_role='mobile_banker'
        )
        expected_str = f"{self.workflow.name} - {step.name}"
        self.assertEqual(str(step), expected_str)

    def test_unique_order_per_workflow(self):
        """Test that order must be unique per workflow."""
        WorkflowStep.objects.create(
            workflow=self.workflow,
            name='Step 1',
            order=1,
            required_role='mobile_banker'
        )
        with self.assertRaises(Exception):  # IntegrityError
            WorkflowStep.objects.create(
                workflow=self.workflow,
                name='Step 2',
                order=1,  # Same order
                required_role='operations_manager'
            )


class ClientKYCModelTestCase(TestCase):
    """Test cases for ClientKYC model."""

    def setUp(self):
        """Set up test data."""
        from users.models import User
        self.mobile_banker = User.objects.create_user(
            email='kyc_mobile@example.com',
            first_name='Mobile',
            last_name='Banker',
            role='mobile_banker',
            password=os.getenv('TEST_USER_PASSWORD', 'test123')
        )
        self.ops_manager = User.objects.create_user(
            email='kyc_ops@example.com',
            first_name='Ops',
            last_name='Manager',
            role='operations_manager',
            password=os.getenv('TEST_USER_PASSWORD', 'test123')
        )
        self.workflow = Workflow.objects.create(
            name='KYC Workflow',
            created_by=self.ops_manager
        )

    def test_create_client_kyc(self):
        """Test creating a client KYC."""
        kyc = ClientKYC.objects.create(
            client_name='Test Client',
            client_id='TEST001',
            status='Pending',
            submitted_by=self.mobile_banker,
            documents={'id': 'doc1.jpg', 'address': 'doc2.jpg'},
            geotag='40.7128,-74.0060',
            workflow=self.workflow
        )
        self.assertEqual(kyc.client_name, 'Test Client')
        self.assertEqual(kyc.client_id, 'TEST001')
        self.assertEqual(kyc.status, 'Pending')
        self.assertEqual(kyc.submitted_by, self.mobile_banker)

    def test_client_kyc_str_representation(self):
        """Test string representation of ClientKYC."""
        kyc = ClientKYC.objects.create(
            client_name='Test Client',
            client_id='TEST001',
            submitted_by=self.mobile_banker,
            documents={}
        )
        expected_str = "KYC for Test Client (Pending)"
        self.assertEqual(str(kyc), expected_str)

    def test_unique_client_id(self):
        """Test that client_id must be unique."""
        ClientKYC.objects.create(
            client_name='Client 1',
            client_id='TEST001',
            submitted_by=self.mobile_banker,
            documents={}
        )
        with self.assertRaises(Exception):  # IntegrityError
            ClientKYC.objects.create(
                client_name='Client 2',
                client_id='TEST001',  # Same ID
                submitted_by=self.mobile_banker,
                documents={}
            )


class FieldCollectionModelTestCase(TestCase):
    """Test cases for FieldCollection model."""

    def setUp(self):
        """Set up test data."""
        from users.models import User
        self.mobile_banker = User.objects.create_user(
            email='field_mobile@example.com',
            first_name='Field',
            last_name='Mobile',
            role='mobile_banker',
            password=os.getenv('TEST_USER_PASSWORD', 'test123')
        )
        self.client_kyc = ClientKYC.objects.create(
            client_name='Test Client',
            client_id='TEST001',
            submitted_by=self.mobile_banker,
            documents={}
        )

    def test_create_field_collection(self):
        """Test creating a field collection."""
        collection = FieldCollection.objects.create(
            client_kyc=self.client_kyc,
            collected_by=self.mobile_banker,
            location='40.7128,-74.0060',
            data={'field1': 'value1', 'field2': 'value2'},
            status='Collected',
            notes='Test collection'
        )
        self.assertEqual(collection.client_kyc, self.client_kyc)
        self.assertEqual(collection.collected_by, self.mobile_banker)
        self.assertEqual(collection.location, '40.7128,-74.0060')
        self.assertEqual(collection.status, 'Collected')

    def test_field_collection_str_representation(self):
        """Test string representation of FieldCollection."""
        collection = FieldCollection.objects.create(
            client_kyc=self.client_kyc,
            collected_by=self.mobile_banker,
            location='40.7128,-74.0060',
            data={'test': 'data'}
        )
        expected_str = f"Field Collection for {self.client_kyc.client_name} by {self.mobile_banker.email}"
        self.assertEqual(str(collection), expected_str)


# Pytest-style tests
@pytest.mark.django_db
class TestOperationsWorkflow:
    """Test operations workflow with pytest."""

    def test_workflow_creation_with_steps(self, user_factory):
        """Test creating a workflow with multiple steps."""
        ops_manager = user_factory(role='operations_manager')
        workflow = Workflow.objects.create(
            name='Complete KYC Workflow',
            description='Full KYC approval process',
            created_by=ops_manager
        )

        step1 = WorkflowStep.objects.create(
            workflow=workflow,
            name='Document Verification',
            order=1,
            required_role='mobile_banker',
            is_required=True
        )

        step2 = WorkflowStep.objects.create(
            workflow=workflow,
            name='Manager Review',
            order=2,
            required_role='operations_manager',
            is_required=True
        )

        assert workflow.steps.count() == 2
        assert step1.workflow == workflow
        assert step2.workflow == workflow
        assert list(workflow.steps.order_by('order')) == [step1, step2]

    def test_kyc_workflow_progression(self, user_factory):
        """Test KYC application through workflow."""
        mobile_banker = user_factory(role='mobile_banker')
        ops_manager = user_factory(role='operations_manager')

        # Create workflow
        workflow = Workflow.objects.create(
            name='KYC Workflow',
            created_by=ops_manager
        )

        # Create KYC application
        kyc = ClientKYC.objects.create(
            client_name='John Doe',
            client_id='KYC001',
            submitted_by=mobile_banker,
            workflow=workflow,
            documents={}
        )

        # Create field collection
        collection = FieldCollection.objects.create(
            client_kyc=kyc,
            collected_by=mobile_banker,
            location='40.7128,-74.0060',
            data={'income': '50000', 'address': '123 Main St'},
            status='Collected'
        )

        assert kyc.status == 'Pending'
        assert collection.status == 'Collected'
        assert kyc.workflow == workflow
