import logging
import os
from typing import Optional

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms


logger = logging.getLogger(__name__)


class LocalMedicalPathologyModel:
    """Transfer-learning trainer/inference model for 4-class pathology classification."""

    CLASS_NAMES = [
        "iron_deficiency_anemia",
        "thalassemia",
        "chronic_myeloid_leukemia",
        "lung_pathology",
    ]

    def __init__(self, device: Optional[torch.device] = None):
        self.device = device if device else torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        self.model = self._build_model()
        self.train_transform = transforms.Compose(
            [
                transforms.Resize((224, 224)),
                transforms.RandomHorizontalFlip(p=0.5),
                transforms.RandomRotation(degrees=10),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
            ]
        )
        self.eval_transform = transforms.Compose(
            [
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
            ]
        )

    def _build_model(self) -> nn.Module:
        model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
        in_features = model.fc.in_features
        model.fc = nn.Linear(in_features, len(self.CLASS_NAMES))
        model.to(self.device)
        return model

    def train(
        self,
        dataset_dir: str,
        output_model_path: str,
        epochs: int = 8,
        batch_size: int = 16,
        learning_rate: float = 1e-4,
        num_workers: int = 0,
    ) -> str:
        """
        Train on dataset structure:
            dataset/train/<class_name>/*
            dataset/test/<class_name>/*
        """
        train_dir = os.path.join(dataset_dir, "train")
        test_dir = os.path.join(dataset_dir, "test")

        if not os.path.isdir(train_dir) or not os.path.isdir(test_dir):
            raise FileNotFoundError("Expected dataset/train and dataset/test directories were not found.")

        train_dataset = datasets.ImageFolder(train_dir, transform=self.train_transform)
        test_dataset = datasets.ImageFolder(test_dir, transform=self.eval_transform)

        if len(train_dataset.classes) != len(self.CLASS_NAMES):
            raise ValueError(
                f"Expected {len(self.CLASS_NAMES)} classes, found {len(train_dataset.classes)}: {train_dataset.classes}"
            )

        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=num_workers)
        test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=num_workers)

        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(self.model.parameters(), lr=learning_rate)

        logger.info("Starting training on device: %s", self.device)
        for epoch in range(epochs):
            self.model.train()
            running_loss = 0.0
            correct = 0
            total = 0

            for inputs, labels in train_loader:
                inputs = inputs.to(self.device)
                labels = labels.to(self.device)

                optimizer.zero_grad()
                outputs = self.model(inputs)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()

                running_loss += float(loss.item())
                _, predicted = torch.max(outputs, 1)
                total += labels.size(0)
                correct += int((predicted == labels).sum().item())

            train_acc = correct / max(total, 1)
            logger.info(
                "Epoch %s/%s | train_loss=%.4f | train_acc=%.2f%%",
                epoch + 1,
                epochs,
                running_loss / max(len(train_loader), 1),
                train_acc * 100,
            )

        self.model.eval()
        test_correct = 0
        test_total = 0
        with torch.no_grad():
            for inputs, labels in test_loader:
                inputs = inputs.to(self.device)
                labels = labels.to(self.device)
                outputs = self.model(inputs)
                _, predicted = torch.max(outputs, 1)
                test_total += labels.size(0)
                test_correct += int((predicted == labels).sum().item())

        test_acc = test_correct / max(test_total, 1)
        logger.info("Test accuracy: %.2f%%", test_acc * 100)

        os.makedirs(os.path.dirname(output_model_path), exist_ok=True)
        torch.save(
            {
                "state_dict": self.model.state_dict(),
                "class_names": self.CLASS_NAMES,
            },
            output_model_path,
        )
        logger.info("Saved local medical pathology model to: %s", output_model_path)
        return output_model_path
